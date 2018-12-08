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

echo "Creating Dockerfile"
sudo cat <<"EOT" > Dockerfile
FROM <%= dockerImage %>
RUN mkdir /built_app || true
<% for(var key in env) { %>
ARG <%- key %>=<%- env[key] %>
<% } %>
<% for(var instruction in buildInstructions) { %>
<%-  buildInstructions[instruction] %>
<% } %> 
ADD ./bundle.tar.gz /_built_app

# In non-root images, we are not able to directly symlink
# /built_app to the bundle, so we instead symlink it's contents
RUN for filename in /_built_app/bundle/*; do \
        ln -s "$filename" "/built_app/$(basename "$filename")"; \
    done
RUN cd /built_app/programs/server && \
    npm install --unsafe-perm
EOT

echo "Finished creating Dockerfile"

sudo chmod 777 ./Dockerfile

echo "Building image"

sudo docker build \
  -t $IMAGE:build \
  --build-arg "NODE_VERSION=<%- nodeVersion %>" \
  . || build_failed

sudo rm -rf bundle

<% if (stopApp) { %>
sudo docker start $APPNAME >/dev/null 2>&1 || true
<% } %>

sudo docker tag $IMAGE:latest $IMAGE:previous || true
sudo docker tag $IMAGE:build $IMAGE:latest
sudo docker image prune -f
