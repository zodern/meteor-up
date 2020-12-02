#!/bin/bash

set -e

APP_DIR=/opt/<%= appName %>
APPNAME=<%= appName %>
IMAGE_PREFIX=<%- imagePrefix %>
IMAGE=$IMAGE_PREFIX'<%= appName.toLowerCase() %>'
USE_BUILDKIT=<%= useBuildKit ? 1 : 0 %>

build_failed() {
  <% if (stopApp) { %>
  sudo docker start $APPNAME >/dev/null 2>&1 || true
  <% } %>
  exit 2
}

echo "Updating base image"
set +e
sudo docker pull <%= dockerImage %>
set -e

<% if (stopApp) { %>
sudo docker stop $APPNAME >/dev/null 2>&1 || true
<% } %>

cd $APP_DIR/tmp

sudo rm -rf bundle

echo "Preparing for docker build"
mkdir bundle
<% if (useBuildKit) { %>
  cp ./bundle.tar.gz ./bundle/bundle.tar.gz
<% } else { %>
  sudo tar -xzf bundle.tar.gz
  sudo chmod 777 ./ -R
<% } %>

cd bundle

echo "Creating Dockerfile"
sudo cat <<"EOT" > Dockerfile
# syntax=docker/dockerfile:1-experimental
FROM <%= dockerImage %>
RUN mkdir /built_app || true
<% for(var key in env) { %>
ARG <%- key %>="<%- env[key] %>"
<% } %>
<% for(var instruction in buildInstructions) { %>
<%-  buildInstructions[instruction] %>
<% } %> 

<% if (useBuildKit) { %>
RUN --mount=type=bind,target=/tmp/__mup-bundle tar -xzf /tmp/__mup-bundle/bundle.tar.gz -C /built_app --strip-components=1 && ls /built_app
<% } else { %>
COPY ./ /built_app
<% } %>
RUN cd /built_app/programs/server && \
    npm install --unsafe-perm
EOT

echo "Finished creating Dockerfile"

sudo chmod 777 ./Dockerfile

echo "Building image"

time sudo DOCKER_BUILDKIT=$USE_BUILDKIT docker build \
  -t $IMAGE:build \
  --build-arg "NODE_VERSION=<%- nodeVersion %>" \
  . || build_failed

sudo rm -rf bundle

<% if (stopApp) { %>
sudo docker start $APPNAME >/dev/null 2>&1 || true
<% } %>

sudo docker tag $IMAGE:latest $IMAGE:previous || true
sudo docker tag $IMAGE:build $IMAGE:<%= tag %>

<% if (privateRegistry) { %>
  echo "Pushing images to private registry"
  # Fails if the previous tag doesn't exist (such as during the initial deploy)
  sudo docker push $IMAGE:previous || true

  sudo docker push $IMAGE:latest
  
<% } %>

echo "Tagged <%= tag %>"

# Can fail if multiple Prepare Bundle apps are run concurrently for different apps
sudo docker image prune -f || true

<% if (useBuildKit) { %>
# Pruning buildkit cache doesn't keep cache entries used for local
# images, so we keep 2GB of cache, which should be enough for most
# apps to reuse cache from previous builds
sudo docker builder prune --keep-storage 2gb --force
<% } %>
