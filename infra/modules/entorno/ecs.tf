# Cómputo (ARQUITECTURA.md 5.1, D-49). ECS Fargate: la web detrás del ALB, el
# worker como segundo servicio de la misma imagen, y las migraciones como tarea
# que se lanza aparte antes de cada despliegue.

locals {
  imagen = "${var.ecr_repository_url}:${var.image_tag}"

  # Lo que no es secreto. La misma imagen sirve a dev y prod; esto es lo que cambia.
  env_comun = [
    { name = "APP_ENV", value = var.app_env },
    { name = "AWS_REGION", value = "us-east-1" },
    { name = "S3_BUCKET", value = aws_s3_bucket.media.bucket },
    { name = "MEDIA_BASE_URL", value = "https://${aws_cloudfront_distribution.media.domain_name}" },
    { name = "SQS_QUEUE_URL", value = aws_sqs_queue.trabajos.url },
    { name = "BETTER_AUTH_URL", value = "https://${aws_cloudfront_distribution.app.domain_name}" },
  ]
  # Sin la variable, el worker usa el proveedor de prueba (no convierte nada).
  env_video    = var.video_transcodificar ? [{ name = "MEDIACONVERT_ROLE_ARN", value = aws_iam_role.mediaconvert.arn }] : []
  env_whatsapp = local.whatsapp_activo ? [{ name = "WHATSAPP_PHONE_NUMBER_ID", value = var.whatsapp_phone_number_id }] : []
  env_todo     = concat(local.env_comun, local.env_video, local.env_whatsapp)
}

resource "aws_ecs_cluster" "principal" {
  name = local.nombre
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/${local.nombre}/web"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/${local.nombre}/worker"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "migrar" {
  name              = "/${local.nombre}/migrar"
  retention_in_days = 90
}

# ---- Roles --------------------------------------------------------------------

data "aws_iam_policy_document" "ecs_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# El de ejecución: lo usa ECS para bajar la imagen, escribir registros y leer el
# secreto al arrancar. El contenedor no lo ve.
resource "aws_iam_role" "ejecucion" {
  name               = "${local.nombre}-ecs-ejecucion"
  assume_role_policy = data.aws_iam_policy_document.ecs_trust.json
}

resource "aws_iam_role_policy_attachment" "ejecucion_base" {
  role       = aws_iam_role.ejecucion.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ejecucion_secretos" {
  role = aws_iam_role.ejecucion.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = local.secretos_arn
    }]
  })
}

# El de la web: firma subidas y consulta objetos en el bucket, y encola.
resource "aws_iam_role" "web" {
  name               = "${local.nombre}-web"
  assume_role_policy = data.aws_iam_policy_document.ecs_trust.json
}

resource "aws_iam_role_policy" "web" {
  role = aws_iam_role.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.media.arn}/*"
      },
      # Sin ListBucket, un HeadObject sobre una clave que no existe devuelve 403
      # en vez de 404, y describe() no puede distinguir "no existe" de "no puedo".
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.media.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.trabajos.arn
      },
    ]
  })
}

# El del worker: consume de la cola. Nada más, hasta que haga falta.
resource "aws_iam_role" "worker" {
  name               = "${local.nombre}-worker"
  assume_role_policy = data.aws_iam_policy_document.ecs_trust.json
}

resource "aws_iam_role_policy" "worker" {
  role = aws_iam_role.worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
      Resource = aws_sqs_queue.trabajos.arn
    }]
  })
}

# ---- Definiciones de tarea ----------------------------------------------------

resource "aws_ecs_task_definition" "web" {
  family                   = "${local.nombre}-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = aws_iam_role.ejecucion.arn
  task_role_arn            = aws_iam_role.web.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  container_definitions = jsonencode([{
    name         = "web"
    image        = local.imagen
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment  = local.env_todo
    secrets      = local.secrets_ecs
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.web.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "web"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.nombre}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ejecucion.arn
  task_role_arn            = aws_iam_role.worker.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  container_definitions = jsonencode([{
    name        = "worker"
    image       = local.imagen
    essential   = true
    command     = ["node", "worker.cjs"]
    environment = local.env_todo
    secrets     = local.secrets_ecs
    # ECS manda SIGTERM y espera esto antes de matar. El worker aborta la
    # espera larga de SQS al recibirlo.
    stopTimeout = 30
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.worker.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "worker"
      }
    }
  }])
}

# Se lanza con `aws ecs run-task` antes de actualizar los servicios. Nunca al
# arrancar el contenedor: dos tareas levantando a la vez migrarían a la vez.
resource "aws_ecs_task_definition" "migrar" {
  family                   = "${local.nombre}-migrar"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ejecucion.arn
  task_role_arn            = aws_iam_role.web.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  container_definitions = jsonencode([{
    name        = "migrar"
    image       = local.imagen
    essential   = true
    command     = ["node", "db/migrate.mts"]
    environment = local.env_todo
    secrets     = local.secrets_ecs
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.migrar.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "migrar"
      }
    }
  }])
}

# ---- Balanceador ----------------------------------------------------------------

resource "aws_lb" "web" {
  name               = "${local.nombre}-web"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.publica[*].id
  idle_timeout       = 60
}

resource "aws_lb_target_group" "web" {
  name                 = "${local.nombre}-web"
  port                 = 3000
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = aws_vpc.principal.id
  deregistration_delay = 15
  health_check {
    path                = "/api/salud"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Solo HTTP: el cifrado con el usuario lo hace CloudFront, y este puerto solo
# acepta lo que viene de CloudFront (grupo de seguridad).
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# ---- Servicios -----------------------------------------------------------------

resource "aws_ecs_service" "web" {
  name            = "web"
  cluster         = aws_ecs_cluster.principal.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.web_desired_count
  launch_type     = "FARGATE"

  # Despliegue continuo: si la tarea nueva no pasa el chequeo, se revierte sola.
  deployment_minimum_healthy_percent = var.web_desired_count > 1 ? 50 : 0
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = local.subredes_tareas
    security_groups  = [aws_security_group.web.id]
    assign_public_ip = !var.tareas_privadas
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "worker" {
  name            = "worker"
  cluster         = aws_ecs_cluster.principal.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.subredes_tareas
    security_groups  = [aws_security_group.worker.id]
    assign_public_ip = !var.tareas_privadas
  }
}
