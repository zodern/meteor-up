#!/bin/bash

APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
BUNDLE_PATH=$APP_PATH/current
ENV_FILE=$APP_PATH/config/env.list
PORT=<%= port %>

# Remove previous version of the app, if exists
docker rm -f $APPNAME

# Remove frontend container if exists
docker rm -f $APPNAME-frontend

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull <%= image %>
set -e

docker run \
  -d \
  --restart=always \
  --publish=$PORT:80 \
  --volume=$BUNDLE_PATH:/bundle \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  <% if(useLocalMongo)  { %>--link=mongodb:mongodb --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME <% } %>\
  <% if(logConfig && logConfig.driver)  { %>--log-driver=<%= logConfig.driver %> <% } %>\
  <% for(var option in logConfig.opts) { %>--log-opt <%= option %>=<%= logConfig.opts[option] %> <% } %>\
  <% for(var volume in volumes) { %>-v <%= volume %>:<%= volumes[volume] %> <% } %>\
  --name=$APPNAME \
  <%= image %>

<% if(typeof sslConfig === "object")  { %>
# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull <%= sslImage %>
set -e

docker run \
  -d \
  --restart=always \
  --volume=/opt/$APPNAME/config/bundle.crt:/bundle.crt \
  --volume=/opt/$APPNAME/config/private.key:/private.key \
  <% for(var volume in sslVolumes) { %>-v <%= volume %>:<%= volumes[volume] %> <% } %>\
  --link=$APPNAME:backend \
  --publish=<%= sslConfig.port %>:443 \
  --name=$APPNAME-frontend \
  <%= sslImage %> /start.sh
<% } %>
