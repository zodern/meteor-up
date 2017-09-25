#!/bin/bash

set -e

APP_DIR=/opt/<%= appName %>
APPNAME=<%= appName %>
START_SCRIPT=$APP_DIR/config/start.sh
IMAGE=mup-<%= appName.toLowerCase() %>

build_failed() {
  sudo docker start $APPNAME || true
  exit 2
}

set +e
sudo docker pull <%= dockerImage %>
set -e

sudo docker stop $APPNAME || true

cd $APP_DIR/tmp

sudo rm -rf bundle
tar -xzf bundle.tar.gz

cd bundle

sudo cat <<EOT > Dockerfile
FROM <%= dockerImage %>
RUN mkdir /built_app
COPY ./ /built_app
<% for(var key in env) { %>
ENV <%- key %>=<%- env[key] %>
<% } %>
RUN cd  /built_app/programs/server && \
    npm install --unsafe-perm
EOT

sudo docker build -t $IMAGE:build . || build_failed

sudo rm -rf bundle

sudo docker start $APPNAME || true

sudo docker tag $IMAGE:latest $IMAGE:previous || true
sudo docker tag $IMAGE:build $IMAGE:latest
sudo docker image prune -f
