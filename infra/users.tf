resource "aws_iam_group" "users" {
  name = "${local.project}-users"
}

resource "aws_iam_user" "api" {
  name = "${local.project}-api"
  tags = {
    app = local.project
  }
}

resource "aws_iam_access_key" "api" {
  user = aws_iam_user.api.name
}

resource "aws_iam_user_group_membership" "api" {
  user = aws_iam_user.api.name

  groups = [
    aws_iam_group.users.name,
  ]
}

resource "aws_iam_group_policy_attachment" "users_read_from_work_queue" {
  group = aws_iam_group.users.name
  policy_arn = aws_iam_policy.read_from_work_queue.arn
}

resource "aws_iam_group_policy_attachment" "users_read_from_work_queue_dl" {
  group = aws_iam_group.users.name
  policy_arn = aws_iam_policy.read_from_work_queue_dl.arn
}

resource "aws_iam_group_policy_attachment" "users_write_to_work_queue" {
  group = aws_iam_group.users.name
  policy_arn = aws_iam_policy.write_to_work_queue.arn
}

resource "aws_iam_group_policy_attachment" "users_access_ethereum_node" {
  group = aws_iam_group.users.name
  policy_arn = aws_iam_policy.access_ethereum_node.arn
}

resource "aws_iam_group_policy_attachment" "users_write_to_image_bucket" {
  group = aws_iam_group.users.name
  policy_arn = aws_iam_policy.write_to_image_bucket.arn
}
