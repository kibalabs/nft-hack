terraform {
  required_version = "~> 1.0.0"

  backend "s3" {
    # aws --profile kiba s3 mb s3://kiba-infra-nfthack-production
    key = "tf-state.json"
    region = "eu-west-1"
    bucket = "kiba-infra-nfthack-production"
    profile = "kiba"
    encrypt = true
  }

  required_providers {
    aws = {
      version = "3.70.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  profile = "kiba"
}

locals {
  project = "mdtp"
}
