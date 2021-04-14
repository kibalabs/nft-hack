resource "aws_iam_policy" "read_from_work_queue" {
  name = "read-queue-${aws_sqs_queue.work_queue.name}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
        Effect = "Allow"
        Action = [
            "sqs:GetQueueUrl",
            "sqs:GetQueueAttributes",
            "sqs:ReceiveMessage",
            "sqs:ChangeMessageVisibility",
            "sqs:ChangeMessageVisibilityBatch",
            "sqs:DeleteMessage",
            "sqs:DeleteMessageBatch",
        ]
        Resource = aws_sqs_queue.work_queue.arn
    }]
  })
}

resource "aws_iam_policy" "read_from_work_queue_dl" {
  name = "read-queue-${aws_sqs_queue.work_queue_dl.name}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
        Effect = "Allow"
        Action = [
            "sqs:GetQueueUrl",
            "sqs:GetQueueAttributes",
            "sqs:ReceiveMessage",
            "sqs:ChangeMessageVisibility",
            "sqs:ChangeMessageVisibilityBatch",
            "sqs:DeleteMessage",
            "sqs:DeleteMessageBatch",
        ]
        Resource = aws_sqs_queue.work_queue_dl.arn
    }]
  })
}

resource "aws_iam_policy" "write_to_work_queue" {
  name = "write-queue-${aws_sqs_queue.work_queue.name}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
        Effect = "Allow"
        Action = [
            "sqs:GetQueueUrl",
            "sqs:GetQueueAttributes",
            "sqs:SendMessage",
            "sqs:SendMessageBatch",
        ]
        Resource = aws_sqs_queue.work_queue.arn
    }]
  })
}

resource "aws_iam_policy" "access_ethereum_node" {
  name = "${local.project}-access-ethereum-node"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
        Effect = "Allow"
        Action = [
            "managedblockchain:GET",
            "managedblockchain:POST"
        ]
        Resource = "arn:aws:managedblockchain:eu-west-1:097520841056:/"
    }]
  })
}

resource "aws_iam_policy" "write_to_image_bucket" {
  name = "${local.project}-write-to-image-bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:DeleteObject",
        "s3:DeleteObjectTagging",
        "s3:DeleteObjectVersion",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:PutObjectRetention",
        "s3:PutObjectTagging",
        "s3:PutObjectLegalHold"
      ],
      Resource = [
        aws_s3_bucket.image_bucket.arn,
        "${aws_s3_bucket.image_bucket.arn}/*",
      ]
    }]
  })
}
