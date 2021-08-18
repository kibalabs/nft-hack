terraform {
  required_version = "~> 1.0.0"

  backend "s3" {
    # aws s3 mb s3://kiba-infra-nfthack-production
    key = "tf-state.json"
    region = "eu-west-1"
    bucket = "kiba-infra-nfthack-production"
    profile = "kiba"
    encrypt = true
  }
}

provider "aws" {
  region = "eu-west-1"
  profile = "kiba"
}

locals {
  project = "mdtp"
}
