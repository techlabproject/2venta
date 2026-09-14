# Cola de trabajo en segundo plano (ARQUITECTURA.md 5.4, D-51). Con su cola de
# fallidos: un mensaje perdido en silencio, en este dominio, es un pago que no
# se liberó.

resource "aws_sqs_queue" "fallidos" {
  name                      = "${local.nombre}-trabajos-fallidos"
  message_retention_seconds = 14 * 24 * 3600
}

resource "aws_sqs_queue" "trabajos" {
  name                       = "${local.nombre}-trabajos"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 4 * 24 * 3600
  receive_wait_time_seconds  = 20
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fallidos.arn
    maxReceiveCount     = 5
  })
}

# ---- El programador encola `liberar` cada hora -------------------------------

data "aws_iam_policy_document" "scheduler_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${local.nombre}-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_trust.json
}

resource "aws_iam_role_policy" "scheduler_sqs" {
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.trabajos.arn
    }]
  })
}

resource "aws_scheduler_schedule" "liberar" {
  name                = "${local.nombre}-liberar-cada-hora"
  schedule_expression = "rate(1 hour)"
  flexible_time_window { mode = "OFF" }
  target {
    arn      = aws_sqs_queue.trabajos.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ type = "liberar" })
  }
}

# El barrido de pedidos abandonados va más seguido que la liberación: mientras uno
# de esos pedidos vive, el artículo del vendedor está bloqueado y no se puede
# comprar. Cada diez minutos con una caducidad de treinta deja el peor caso en
# cuarenta, que es tolerable.
resource "aws_scheduler_schedule" "caducar" {
  name                = "${local.nombre}-caducar-cada-10-min"
  schedule_expression = "rate(10 minutes)"
  flexible_time_window { mode = "OFF" }
  target {
    arn      = aws_sqs_queue.trabajos.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ type = "caducar" })
  }
}
