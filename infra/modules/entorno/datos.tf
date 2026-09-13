# Base de datos (ARQUITECTURA.md 5.2). En subred privada, sin acceso público,
# cifrada, con respaldos. Multi-AZ lo decide el entorno: en prod hay dinero
# retenido en esta base.

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "db" {
  name       = "dosventa-${var.entorno}-db"
  subnet_ids = aws_subnet.privada[*].id
}

# El identificador de RDS no puede empezar por dígito.
resource "aws_db_instance" "db" {
  identifier     = "dosventa-${var.entorno}-db"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.db_instance_class

  db_name  = "app"
  username = "app"
  password = random_password.db.result

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = var.db_multi_az

  backup_retention_period   = var.db_backup_days
  backup_window             = "06:00-07:00" # 01:00-02:00 Bogotá
  maintenance_window        = "sun:07:00-sun:08:00"
  deletion_protection       = var.db_deletion_protection
  skip_final_snapshot       = !var.db_deletion_protection
  final_snapshot_identifier = var.db_deletion_protection ? "dosventa-${var.entorno}-db-final" : null
  copy_tags_to_snapshot     = true

  performance_insights_enabled = false
  apply_immediately            = var.entorno == "dev"
}

# La conexión verifica el certificado del servidor contra la CA de RDS, que va
# dentro de la imagen (Dockerfile). Sin verify-full, un sslmode=require en `pg`
# no comprueba nada.
locals {
  database_url = "postgres://app:${random_password.db.result}@${aws_db_instance.db.address}:5432/app?sslmode=verify-full&sslrootcert=/app/rds-ca.pem"
}
