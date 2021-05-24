resource "aws_cloudfront_distribution" "images" {
  origin {
    domain_name = aws_s3_bucket.image_bucket.bucket_regional_domain_name
    origin_id = aws_s3_bucket.image_bucket.id
  }

  origin {
    domain_name = "mdtp-api.kibalabs.com"
    origin_id = "api"
    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }

  enabled = true
  is_ipv6_enabled = true

  aliases = []

  ordered_cache_behavior {
    path_pattern = "/pablo/*"
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.image_bucket.id
    viewer_protocol_policy = "allow-all"
    min_ttl = 0
    default_ttl = 3600
    max_ttl = 86400
    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = "api"
    viewer_protocol_policy = "redirect-to-https"
    min_ttl = 0
    default_ttl = 3600
    max_ttl = 86400
    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_200"

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    app = local.project
  }
}
