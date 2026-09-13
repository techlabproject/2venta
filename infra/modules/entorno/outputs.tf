output "url" {
  description = "Dirección pública de la aplicación."
  value       = "https://${aws_cloudfront_distribution.app.domain_name}"
}

output "media_url" {
  value = "https://${aws_cloudfront_distribution.media.domain_name}"
}

output "cluster" { value = aws_ecs_cluster.principal.name }
output "cola_url" { value = aws_sqs_queue.trabajos.url }
output "bucket_media" { value = aws_s3_bucket.media.bucket }
output "db_endpoint" { value = aws_db_instance.db.address }
output "alb_dns" { value = aws_lb.web.dns_name }

# Lo que hay que correr antes de actualizar los servicios.
output "comando_migrar" {
  value = join(" ", [
    "aws ecs run-task",
    "--cluster ${aws_ecs_cluster.principal.name}",
    "--task-definition ${aws_ecs_task_definition.migrar.family}",
    "--launch-type FARGATE",
    "--network-configuration 'awsvpcConfiguration={subnets=[${join(",", local.subredes_tareas)}],securityGroups=[${aws_security_group.web.id}],assignPublicIp=${var.tareas_privadas ? "DISABLED" : "ENABLED"}}'",
  ])
}

output "subredes_tareas" { value = local.subredes_tareas }
output "sg_web" { value = aws_security_group.web.id }
output "asignar_ip_publica" { value = var.tareas_privadas ? "DISABLED" : "ENABLED" }
output "task_migrar" { value = aws_ecs_task_definition.migrar.family }
