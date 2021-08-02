#!/usr/bin/env bash
set -e -o pipefail

envsubst '${SERVICE_NAME} ${VERSION}' < nginx.conf > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
