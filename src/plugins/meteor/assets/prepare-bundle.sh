#!/bin/bash

set -e

APP_DIR=/opt/<%= appName %>
APPNAME=<%= appName %>
START_SCRIPT=$APP_DIR/config/start.sh
IMAGE=mup-<%= appName %> 

build_failed() {
  docker start $APPNAME || true
  exit 2
}

docker pull <%= dockerImage %>
docker stop $APPNAME || true

cd $APP_DIR/tmp

sudo rm -rf bundle
tar -xzf bundle.tar.gz

cd bundle

sudo cat <<EOT > Dockerfile
FROM <%= dockerImage %>
RUN mkdir /built_app
COPY ./ /built_app
RUN cd /built_app/programs/server && npm install --unsafe-perm
EOT

docker build -t $IMAGE:build . || build_failed

sudo rm -rf bundle

docker start $APPNAME || true

docker tag $IMAGE:latest $IMAGE:previous || true
docker tag $IMAGE:build $IMAGE:latest
docker image prune -f
