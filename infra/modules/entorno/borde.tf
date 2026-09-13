# Borde (ARQUITECTURA.md 5.6). CloudFront delante del balanceador. Es lo que da
# HTTPS sin dominio propio (certificado de *.cloudfront.net) y, cuando haya
# dominio, es donde se asocia.

# Políticas administradas por AWS. Identificadores fijos, documentados en
# https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
locals {
  cache_desactivada = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  cache_optimizada  = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  origen_todo       = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer (incluye Host)
}

resource "aws_cloudfront_distribution" "app" {
  enabled         = true
  comment         = "${local.nombre} aplicación"
  price_class     = "PriceClass_100"
  is_ipv6_enabled = true
  web_acl_id      = var.waf ? aws_wafv2_web_acl.app[0].arn : null

  origin {
    domain_name = aws_lb.web.dns_name
    origin_id   = "alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Todo dinámico, sin caché. Se reenvía la cabecera Host tal cual: Next
  # compara Origin con Host en las acciones de servidor, y si llegara el DNS
  # del balanceador las rechazaría todas.
  default_cache_behavior {
    target_origin_id         = "alb"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = local.cache_desactivada
    origin_request_policy_id = local.origen_todo
  }

  # Los estáticos de Next llevan hash en el nombre: caché larga sin riesgo.
  ordered_cache_behavior {
    path_pattern             = "/_next/static/*"
    target_origin_id         = "alb"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = local.cache_optimizada
    origin_request_policy_id = local.origen_todo
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}

# WAF: reglas administradas y un límite de tasa volumétrico. La aplicación
# limita por número de celular; esto cubre la otra capa (5.6).
resource "aws_wafv2_web_acl" "app" {
  count = var.waf ? 1 : 0
  name  = "${local.nombre}-app"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "comunes"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "comunes"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "tasa"
    priority = 2
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "tasa"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.nombre}-app"
    sampled_requests_enabled   = true
  }
}
