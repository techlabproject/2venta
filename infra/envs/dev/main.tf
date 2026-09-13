# Entorno de desarrollo en la nube. Barato a propósito: una tarea de cada cosa,
# base de una zona, sin NAT. Proveedores de prueba (APP_ENV=desarrollo).

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  backend "s3" {
    bucket       = "2venta-terraform-681842289811"
    key          = "envs/dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags { tags = { proyecto = "2venta", entorno = "dev", gestion = "terraform" } }
}

variable "image_tag" { type = string }

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

  entorno            = "dev"
  app_env            = "desarrollo"
  image_tag          = var.image_tag
  ecr_repository_url = data.terraform_remote_state.cuenta.outputs.ecr_url
  vpc_cidr           = "10.20.0.0/16"

  tareas_privadas        = false
  db_instance_class      = "db.t4g.micro"
  db_multi_az            = false
  db_backup_days         = 1 # el plan gratuito de AWS no admite más; subir al pasar a plan de pago
  db_deletion_protection = false

  web_cpu           = 256
  web_memory        = 512
  web_desired_count = 1
  waf               = false
  # El plan gratuito de AWS no incluye MediaConvert. Poner en true al pasar a plan de pago.
  video_transcodificar = false

  correos_alertas = ["catalinag0226@outlook.com", "nicolasdrr25@gmail.com"]
}

output "url" { value = module.entorno.url }
output "media_url" { value = module.entorno.media_url }
output "cluster" { value = module.entorno.cluster }
output "cola_url" { value = module.entorno.cola_url }
output "comando_migrar" { value = module.entorno.comando_migrar }
output "subredes_tareas" { value = module.entorno.subredes_tareas }
output "sg_web" { value = module.entorno.sg_web }
output "task_migrar" { value = module.entorno.task_migrar }
output "asignar_ip_publica" { value = module.entorno.asignar_ip_publica }
