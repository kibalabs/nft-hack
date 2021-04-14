#!/usr/bin/env bash
set -e -o pipefail

docker stop ${DB_NAME} || true
docker rm ${DB_NAME} || true

echo "dumping..."
mkdir -p ./tmp

# TODO(krishan711): with vpn this should work directly.
ssh freebox "pg_dump -x -O -Z9 -U ${REMOTE_DB_USERNAME} -h ${REMOTE_DB_HOST} -p ${REMOTE_DB_PORT} ${REMOTE_DB_NAME}" > ./tmp/dblocal.sql.gz
gunzip -f ./tmp/dblocal.sql.gz

cid=$(docker run --name ${DB_NAME} -d -p ${DB_PORT}:5432 -e POSTGRES_PASSWORD=${DB_PASSWORD} -v $(pwd)/tmp/:/tmp/ postgres:12.5)
sleep 3
docker exec ${cid} bash -c "exec psql -h ${DB_HOST} -U ${DB_USERNAME} -c 'CREATE DATABASE ${DB_NAME}'"
docker exec ${cid} bash -c "exec psql -h ${DB_HOST} -U ${DB_USERNAME} -d ${DB_NAME} -f /tmp/dblocal.sql"
docker logs -f $cid
