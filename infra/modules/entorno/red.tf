# Red (ARQUITECTURA.md 5.6). Dos zonas, subredes públicas para el balanceador y
# privadas para la base. Dónde corren las tareas lo decide `tareas_privadas`.

locals {
  nombre = "2venta-${var.entorno}"
  zonas  = slice(data.aws_availability_zones.disponibles.names, 0, 2)
}

data "aws_availability_zones" "disponibles" {
  state = "available"
}

resource "aws_vpc" "principal" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = local.nombre }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.principal.id
  tags   = { Name = local.nombre }
}

resource "aws_subnet" "publica" {
  count                   = 2
  vpc_id                  = aws_vpc.principal.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.zonas[count.index]
  map_public_ip_on_launch = false
  tags                    = { Name = "${local.nombre}-publica-${count.index}" }
}

resource "aws_subnet" "privada" {
  count             = 2
  vpc_id            = aws_vpc.principal.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, 8 + count.index)
  availability_zone = local.zonas[count.index]
  tags              = { Name = "${local.nombre}-privada-${count.index}" }
}

resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.principal.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${local.nombre}-publica" }
}

resource "aws_route_table_association" "publica" {
  count          = 2
  subnet_id      = aws_subnet.publica[count.index].id
  route_table_id = aws_route_table.publica.id
}

# NAT solo cuando las tareas viven en privadas. Es la pieza cara de la lista.
resource "aws_eip" "nat" {
  count  = var.tareas_privadas ? 1 : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = var.tareas_privadas ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.publica[0].id
  tags          = { Name = local.nombre }
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "privada" {
  vpc_id = aws_vpc.principal.id
  dynamic "route" {
    for_each = var.tareas_privadas ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.nat[0].id
    }
  }
  tags = { Name = "${local.nombre}-privada" }
}

resource "aws_route_table_association" "privada" {
  count          = 2
  subnet_id      = aws_subnet.privada[count.index].id
  route_table_id = aws_route_table.privada.id
}

# El endpoint de S3 es de pasarela y gratis: el tráfico al bucket no sale a
# internet en ningún entorno.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.principal.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.publica.id, aws_route_table.privada.id]
  tags              = { Name = "${local.nombre}-s3" }
}

# Endpoints de interfaz solo con tareas privadas: cada uno cuesta lo mismo que
# un cuarto de NAT, y en dev el tráfico sale por la IP pública de la tarea.
locals {
  endpoints_interfaz = var.tareas_privadas ? ["sqs", "secretsmanager", "ecr.api", "ecr.dkr", "logs"] : []
}

resource "aws_security_group" "endpoints" {
  count       = var.tareas_privadas ? 1 : 0
  name        = "${local.nombre}-endpoints"
  description = "Endpoints de VPC: HTTPS desde la VPC"
  vpc_id      = aws_vpc.principal.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_vpc_endpoint" "interfaz" {
  for_each            = toset(local.endpoints_interfaz)
  vpc_id              = aws_vpc.principal.id
  service_name        = "com.amazonaws.us-east-1.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.privada[*].id
  security_group_ids  = [aws_security_group.endpoints[0].id]
  private_dns_enabled = true
  tags                = { Name = "${local.nombre}-${each.value}" }
}

# ---- Grupos de seguridad: quién habla con quién ------------------------------

# El balanceador solo acepta lo que viene de CloudFront. Una petición directa a
# su DNS no llega ni al puerto.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "${local.nombre}-alb"
  description = "ALB: HTTP solo desde CloudFront"
  vpc_id      = aws_vpc.principal.id
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "web" {
  name        = "${local.nombre}-web"
  description = "Tareas web: 3000 solo desde el ALB"
  vpc_id      = aws_vpc.principal.id
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "worker" {
  name        = "${local.nombre}-worker"
  description = "Worker: nada de entrada"
  vpc_id      = aws_vpc.principal.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name        = "${local.nombre}-db"
  description = "Postgres: solo desde web y worker"
  vpc_id      = aws_vpc.principal.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id, aws_security_group.worker.id]
  }
}

locals {
  subredes_tareas = var.tareas_privadas ? aws_subnet.privada[*].id : aws_subnet.publica[*].id
}
