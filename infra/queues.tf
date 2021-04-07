resource "aws_sqs_queue" "work_queue_dl" {
  name = "${local.project}-work-queue-dl"
  delay_seconds = 0
  max_message_size = 256 * 1024
  visibility_timeout_seconds = 60 * 5
  message_retention_seconds = 14 * 24 * 60 * 60
  receive_wait_time_seconds = 0
  tags = {
    app = local.project
  }
}

resource "aws_sqs_queue" "work_queue" {
  name = "${local.project}-work-queue"
  delay_seconds = 0
  max_message_size = 256 * 1024
  visibility_timeout_seconds = 60 * 5
  message_retention_seconds = 14 * 24 * 60 * 60
  receive_wait_time_seconds = 0
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.work_queue_dl.arn
    maxReceiveCount = 3
  })
  tags = {
    app = local.project
  }
}
