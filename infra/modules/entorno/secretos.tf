# Secretos (ARQUITECTURA.md 5.5, D-52). Un secreto por entorno con todas las
# claves en JSON; ECS inyecta cada una como variable de entorno.
#
# Los de firma y cifrado los genera Terraform una sola vez. Ninguno tiene
# `keepers`: no se regeneran solos. PHONE_CODE_SECRET y PICKUP_CODE_SECRET cifran
# datos guardados; regenerarlos deja códigos de entrega ilegibles.

resource "random_password" "secreto" {
  for_each = toset([
    "BETTER_AUTH_SECRET",
    "PHONE_CODE_SECRET",
    "PICKUP_CODE_SECRET",
    "KYC_WEBHOOK_SECRET",
    "PAYMENTS_WEBHOOK_SECRET",
    "SHIPPING_WEBHOOK_SECRET",
    "CRON_SECRET",
  ])
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.nombre}/app"
  recovery_window_in_days = var.entorno == "dev" ? 0 : 30
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(merge(
    { for k, v in random_password.secreto : k => v.result },
    { DATABASE_URL = local.database_url },
    var.sms_provider_token != "" ? { SMS_PROVIDER_TOKEN = var.sms_provider_token } : {},
  ))
}

locals {
  claves_secretas = concat(
    keys(random_password.secreto),
    ["DATABASE_URL"],
    var.sms_provider_token != "" ? ["SMS_PROVIDER_TOKEN"] : [],
  )
  # Lo que ECS pone en cada contenedor a partir del secreto.
  secrets_ecs = [
    for k in local.claves_secretas : {
      name      = k
      valueFrom = "${aws_secretsmanager_secret.app.arn}:${k}::"
    }
  ]
}
