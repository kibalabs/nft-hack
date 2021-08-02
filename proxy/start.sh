#!/usr/bin/env bash
set -e -o pipefail

exec nginx -g 'daemon off;'
