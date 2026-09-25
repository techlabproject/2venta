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
    # La clave con la que Meta verifica la dirección del webhook de WhatsApp: es
    # nuestra, no de Meta, así que se genera aquí como las demás (D-117).
    "WHATSAPP_VERIFY_TOKEN",
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
  ))
}

# El token de Meta y el secreto de la app no los genera ni los ve Terraform: el
# secreto se crea vacío y se llena a mano (infra/LEEME.md). Así no quedan en el
# estado de Terraform ni los borra el `apply` de cada despliegue.
resource "aws_secretsmanager_secret" "whatsapp" {
  count                   = var.whatsapp_secreto ? 1 : 0
  name                    = "${local.nombre}/whatsapp"
  recovery_window_in_days = var.entorno == "dev" ? 0 : 30
}

# Igual con Twilio (D-120): el Auth Token se pone a mano.
resource "aws_secretsmanager_secret" "twilio" {
  count                   = var.twilio_secreto ? 1 : 0
  name                    = "${local.nombre}/twilio"
  recovery_window_in_days = var.entorno == "dev" ? 0 : 30
}

# Y con Inalambria Express (D-124): el token de su API se pone a mano.
resource "aws_secretsmanager_secret" "inalambria" {
  count                   = var.inalambria_secreto ? 1 : 0
  name                    = "${local.nombre}/inalambria"
  recovery_window_in_days = var.entorno == "dev" ? 0 : 30
}

locals {
  claves_secretas = concat(keys(random_password.secreto), ["DATABASE_URL"])
  whatsapp_activo = var.whatsapp_secreto && var.whatsapp_phone_number_id != ""
  twilio_activo   = var.twilio_secreto && var.twilio_account_sid != ""
  # Inalambria no tiene un identificador que no sea secreto: se conecta con su
  # propia bandera, después de llenar el secreto.
  inalambria_activo = var.inalambria_secreto && var.inalambria_activo
  # Lo que ECS pone en cada contenedor a partir de los secretos.
  secrets_ecs = concat(
    [
      for k in local.claves_secretas : {
        name      = k
        valueFrom = "${aws_secretsmanager_secret.app.arn}:${k}::"
      }
    ],
    local.whatsapp_activo ? [
      for k in ["WHATSAPP_TOKEN", "WHATSAPP_APP_SECRET"] : {
        name      = k
        valueFrom = "${aws_secretsmanager_secret.whatsapp[0].arn}:${k}::"
      }
    ] : [],
    local.twilio_activo ? [{
      name      = "TWILIO_AUTH_TOKEN"
      valueFrom = "${aws_secretsmanager_secret.twilio[0].arn}:TWILIO_AUTH_TOKEN::"
    }] : [],
    local.inalambria_activo ? [{
      name      = "INALAMBRIA_TOKEN"
      valueFrom = "${aws_secretsmanager_secret.inalambria[0].arn}:INALAMBRIA_TOKEN::"
    }] : [],
  )
  secretos_arn = concat(
    [aws_secretsmanager_secret.app.arn],
    aws_secretsmanager_secret.whatsapp[*].arn,
    aws_secretsmanager_secret.twilio[*].arn,
    aws_secretsmanager_secret.inalambria[*].arn,
  )
}
