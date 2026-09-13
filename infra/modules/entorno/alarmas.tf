# Alarmas (ARQUITECTURA.md 5.7). Las que hablan del dominio, no las genéricas.

resource "aws_sns_topic" "alertas" {
  name = "${local.nombre}-alertas"
}

resource "aws_sns_topic_subscription" "correo" {
  for_each  = toset(var.correos_alertas)
  topic_arn = aws_sns_topic.alertas.arn
  protocol  = "email"
  endpoint  = each.value
}

# Un trabajo que se perdió en silencio. La primera de la lista.
resource "aws_cloudwatch_metric_alarm" "cola_fallidos" {
  alarm_name          = "${local.nombre}-cola-fallidos"
  alarm_description   = "Hay mensajes en la cola de fallidos: un trabajo no se pudo procesar tras 5 intentos"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = aws_sqs_queue.fallidos.name }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alertas.arn]
  ok_actions          = [aws_sns_topic.alertas.arn]
}

# Errores del servidor detrás del balanceador.
resource "aws_cloudwatch_metric_alarm" "errores_5xx" {
  alarm_name        = "${local.nombre}-errores-5xx"
  alarm_description = "Más de 5 respuestas 5xx en 5 minutos"
  namespace         = "AWS/ApplicationELB"
  metric_name       = "HTTPCode_Target_5XX_Count"
  dimensions = {
    LoadBalancer = aws_lb.web.arn_suffix
    TargetGroup  = aws_lb_target_group.web.arn_suffix
  }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alertas.arn]
}

# La web se quedó sin tareas sanas.
resource "aws_cloudwatch_metric_alarm" "sin_tareas_sanas" {
  alarm_name        = "${local.nombre}-sin-tareas-sanas"
  alarm_description = "Ninguna tarea web pasa el chequeo de salud"
  namespace         = "AWS/ApplicationELB"
  metric_name       = "HealthyHostCount"
  dimensions = {
    LoadBalancer = aws_lb.web.arn_suffix
    TargetGroup  = aws_lb_target_group.web.arn_suffix
  }
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alertas.arn]
  ok_actions          = [aws_sns_topic.alertas.arn]
}
