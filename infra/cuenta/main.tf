# Lo que existe una sola vez por cuenta, compartido por todos los entornos.

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
  backend "s3" {
    bucket       = "2venta-terraform-681842289811"
    key          = "cuenta/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags { tags = { proyecto = "2venta", gestion = "terraform" } }
}

# ---- Repositorio de imágenes -------------------------------------------------

resource "aws_ecr_repository" "app" {
  name                 = "2venta"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# Se conservan las últimas 30 imágenes; el resto se borra solo.
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "conservar las últimas 30"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

# ---- GitHub Actions entra con OIDC, sin llaves guardadas ---------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # Solo este repositorio puede asumir el rol: desde la rama main, o desde un
    # job que declara `environment: dev` (GitHub cambia el `sub` en ese caso).
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:techlabproject/2venta:ref:refs/heads/main",
        "repo:techlabproject/2venta:environment:dev",
      ]
    }
  }
}

resource "aws_iam_role" "despliegue" {
  name               = "2venta-despliegue-github"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}

# El flujo aplica Terraform, así que necesita permisos amplios. Es la parte que
# más conviene estrechar cuando la infraestructura deje de cambiar cada semana.
resource "aws_iam_role_policy_attachment" "despliegue_admin" {
  role       = aws_iam_role.despliegue.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "ecr_url" { value = aws_ecr_repository.app.repository_url }
output "rol_despliegue_arn" { value = aws_iam_role.despliegue.arn }
