variable "entorno" {
  description = "Nombre corto: dev o prod. Prefija todos los recursos (D-53)."
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.entorno)
    error_message = "Solo dev o prod."
  }
}

variable "app_env" {
  description = "Valor de APP_ENV dentro de los contenedores (D-54)."
  type        = string
  validation {
    condition     = contains(["desarrollo", "produccion"], var.app_env)
    error_message = "Solo desarrollo o produccion."
  }
}

variable "image_tag" {
  description = "Etiqueta de la imagen en ECR que se despliega. Sin valor por defecto a propósito."
  type        = string
}

variable "ecr_repository_url" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "tareas_privadas" {
  description = "true: tareas en subredes privadas con NAT (prod). false: públicas con IP pública, sin NAT (dev)."
  type        = bool
}

variable "db_instance_class" {
  type = string
}

variable "db_multi_az" {
  type = bool
}

variable "db_backup_days" {
  type = number
}

variable "db_deletion_protection" {
  type = bool
}

variable "web_cpu" {
  type = number
}

variable "web_memory" {
  type = number
}

variable "web_desired_count" {
  type = number
}

variable "worker_cpu" {
  type    = number
  default = 256
}

variable "worker_memory" {
  type    = number
  default = 512
}

variable "waf" {
  description = "Poner WAF delante de CloudFront."
  type        = bool
}

variable "correos_alertas" {
  description = "A dónde van las alarmas de CloudWatch."
  type        = list(string)
}

# WhatsApp Cloud para los códigos (D-117). En dos pasos, para no dejar tareas que
# no arrancan: primero `whatsapp_secreto = true` crea el secreto `<entorno>/whatsapp`
# vacío y alguien le pone WHATSAPP_TOKEN y WHATSAPP_APP_SECRET a mano (nunca pasan
# por Terraform ni por el repositorio); después `whatsapp_phone_number_id` lo conecta.
variable "whatsapp_secreto" {
  description = "Crea el secreto <entorno>/whatsapp, vacío, para llenarlo a mano."
  type        = bool
  default     = false
}

variable "whatsapp_phone_number_id" {
  description = "Id del número de WhatsApp Business. Vacío = los códigos no salen por WhatsApp."
  type        = string
  default     = ""
}

variable "video_transcodificar" {
  description = "Usar MediaConvert de verdad. En una cuenta con plan gratuito no está disponible (SubscriptionRequired)."
  type        = bool
}
