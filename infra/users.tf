resource "aws_iam_group" "nfthack_users" {
  name = "nfthack-users"
}

resource "aws_iam_user" "nfthack_api" {
  name = "nfthack-api"
  tags = {
    app = "nfthack"
  }
}

resource "aws_iam_access_key" "nfthack_api" {
  user = aws_iam_user.nfthack_api.name
}

resource "aws_iam_user_group_membership" "nfthack_api" {
  user = aws_iam_user.nfthack_api.name

  groups = [
    aws_iam_group.nfthack_users.name,
  ]
}
