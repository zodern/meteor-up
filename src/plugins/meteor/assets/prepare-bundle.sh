#!/bin/bash

set -e

APP_DIR=/opt/<%= appName %>
APPNAME=<%= appName %>
IMAGE=mup-<%= appName.toLowerCase() %>

build_failed() {
  <% if (stopApp) { %>
  sudo docker start $APPNAME >/dev/null 2>&1 || true
  <% } %>
  exit 2
}

set +e
sudo docker pull <%= dockerImage %>
set -e

<% if (stopApp) { %>
sudo docker stop $APPNAME >/dev/null 2>&1 || true
<% } %>

cd $APP_DIR/tmp

sudo rm -rf bundle
sudo tar -xzf bundle.tar.gz
sudo chmod 777 ./ -R
echo "Finished Extracting"
cd bundle

echo "Creating Dockerfile"
sudo cat <<EOT > Dockerfile
FROM <%= dockerImage %>
RUN mkdir /built_app || true
<% for(var key in env) { %>
ENV <%- key %>=<%- env[key] %>
<% } %>
<% for(var instruction in buildInstructions) { %>
<%-  buildInstructions[instruction] %>
<% } %>
COPY ./ /built_app
RUN cd  /built_app/programs/server && \
    npm install --unsafe-perm
EOT

echo "Finished creating Dockerfile"

sudo chmod 777 ./Dockerfile

echo "Building image"

sudo docker build -t $IMAGE:build . || build_failed

sudo rm -rf bundle

<% if (stopApp) { %>
sudo docker start $APPNAME >/dev/null 2>&1 || true
<% } %>

sudo docker tag $IMAGE:latest $IMAGE:previous || true
sudo docker tag $IMAGE:build $IMAGE:latest
sudo docker image prune -f
