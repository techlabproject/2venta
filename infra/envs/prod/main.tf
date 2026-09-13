# Producción. Definido y sin aplicar: sin proveedor de SMS la aplicación se niega
# a arrancar en `produccion` (D-47). Cuando exista, hay que pasar
# `sms_provider_token` y aplicar. Todo lo de ARQUITECTURA.md 5: Multi-AZ, NAT,
# endpoints de VPC, WAF, dos tareas web en dos zonas.

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  backend "s3" {
    bucket       = "2venta-terraform-681842289811"
    key          = "envs/prod/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags { tags = { proyecto = "2venta", entorno = "prod", gestion = "terraform" } }
}

variable "image_tag" { type = string }
variable "sms_provider_token" {
  type      = string
  sensitive = true
}

data "terraform_remote_state" "cuenta" {
  backend = "s3"
  config = {
    bucket = "2venta-terraform-681842289811"
    key    = "cuenta/terraform.tfstate"
    region = "us-east-1"
  }
}

module "entorno" {
  source = "../../modules/entorno"

  entorno            = "prod"
  app_env            = "produccion"
  image_tag          = var.image_tag
  ecr_repository_url = data.terraform_remote_state.cuenta.outputs.ecr_url
  vpc_cidr           = "10.30.0.0/16"

  tareas_privadas        = true
  db_instance_class      = "db.t4g.small"
  db_multi_az            = true
  db_backup_days         = 14
  db_deletion_protection = true

  web_cpu              = 512
  web_memory           = 1024
  web_desired_count    = 2
  waf                  = true
  video_transcodificar = true

  sms_provider_token = var.sms_provider_token
  correos_alertas    = ["catalinag0226@outlook.com", "nicolasdrr25@gmail.com"]
}

output "url" { value = module.entorno.url }
output "media_url" { value = module.entorno.media_url }
output "cluster" { value = module.entorno.cluster }
output "comando_migrar" { value = module.entorno.comando_migrar }
