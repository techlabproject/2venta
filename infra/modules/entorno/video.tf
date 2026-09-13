# Transcodificación (S-30, ARQUITECTURA.md 5.4). El worker crea el trabajo de
# MediaConvert; cuando termina, EventBridge encola `video_listo` y el worker
# actualiza la publicación. Sin Lambda: toda la lógica sigue en el worker.

# ---- Rol con el que MediaConvert lee el original y escribe la salida ---------

data "aws_iam_policy_document" "mediaconvert_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["mediaconvert.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "mediaconvert" {
  name               = "${local.nombre}-mediaconvert"
  assume_role_policy = data.aws_iam_policy_document.mediaconvert_trust.json
}

resource "aws_iam_role_policy" "mediaconvert" {
  role = aws_iam_role.mediaconvert.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.media.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.media.arn}/transcodificado/*"
      },
    ]
  })
}

# El worker crea trabajos y le pasa ese rol a MediaConvert; también consulta si
# la salida ya existe antes de crear otro.
resource "aws_iam_role_policy" "worker_video" {
  role = aws_iam_role.worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["mediaconvert:CreateJob", "mediaconvert:DescribeEndpoints"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = aws_iam_role.mediaconvert.arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.media.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.trabajos.arn
      },
    ]
  })
}

# ---- MediaConvert terminó → EventBridge → cola ---------------------------------

resource "aws_cloudwatch_event_rule" "video_listo" {
  name        = "${local.nombre}-video-listo"
  description = "Un trabajo de MediaConvert de este entorno terminó bien"
  event_pattern = jsonencode({
    source        = ["aws.mediaconvert"]
    "detail-type" = ["MediaConvert Job State Change"]
    detail = {
      status       = ["COMPLETE"]
      userMetadata = { original = [{ exists = true }] }
      # Solo los trabajos que este entorno creó: el rol es el de este entorno.
      # (MediaConvert no expone el rol en el evento; se filtra por el bucket de
      # salida, que sí lleva el nombre del entorno.)
      outputGroupDetails = {
        outputDetails = {
          outputFilePaths = [{ prefix = "s3://${aws_s3_bucket.media.bucket}/" }]
        }
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "video_listo" {
  rule = aws_cloudwatch_event_rule.video_listo.name
  arn  = aws_sqs_queue.trabajos.arn

  # Arma el mensaje con la forma que parseJob entiende. La salida llega como
  # s3://bucket/clave; el worker recibe la clave sin el prefijo.
  input_transformer {
    input_paths = {
      original = "$.detail.userMetadata.original"
      salida   = "$.detail.outputGroupDetails[0].outputDetails[0].outputFilePaths[0]"
    }
    input_template = <<-EOT
      {"type":"video_listo","original":<original>,"salida":<salida>}
    EOT
  }
}

# La cola tiene que dejar que EventBridge le escriba.
data "aws_iam_policy_document" "cola_eventbridge" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.trabajos.arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.video_listo.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "trabajos" {
  queue_url = aws_sqs_queue.trabajos.id
  policy    = data.aws_iam_policy_document.cola_eventbridge.json
}
