#!/bin/bash

APPNAME=<%= appName %>
CLIENTSIZE=<%= nginxClientUploadLimit %>
APP_PATH=/opt/$APPNAME
BUNDLE_PATH=$APP_PATH/current
ENV_FILE=$APP_PATH/config/env.list
PORT=<%= port %>
BIND=<%= bind %>
NGINX_PROXY_VERSION=latest
LETS_ENCRYPT_VERSION=latest
APP_IMAGE=mup-<%= appName.toLowerCase() %>
IMAGE=$APP_IMAGE:latest
LOCAL_IMAGE=false

sudo docker run \
  -d \
  --restart=always \
  $VOLUME \
  <% if((sslConfig && typeof sslConfig.autogenerate === "object") || (typeof proxyConfig === "object"))  { %> \
  --expose=80 \
  <% } else { %> \
  --publish=$BIND:$PORT:<%= docker.imagePort %> \
  <% } %> \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  <% if(logConfig && logConfig.driver)  { %>--log-driver=<%= logConfig.driver %> <% } %> \
  <% for(var option in logConfig.opts) { %>--log-opt <%= option %>=<%= logConfig.opts[option] %> <% } %> \
  <% for(var volume in volumes) { %>-v <%= volume %>:<%= volumes[volume] %> <% } %> \
  <% for(var args in docker.args) { %> <%- docker.args[args] %> <% } %> \
  <% if(sslConfig && typeof sslConfig.autogenerate === "object")  { %> \
    -e "VIRTUAL_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_EMAIL=<%= sslConfig.autogenerate.email %>" \
    -e "HTTPS_METHOD=noredirect" \
  <% } %> \
  --name=$APPNAME \
  $IMAGE

echo "Ran <%= docker.image %>"
sleep 15s

<% for(var network in docker.networks) { %>
  sudo docker network connect <%=  docker.networks[network] %> $APPNAME
<% } %>
