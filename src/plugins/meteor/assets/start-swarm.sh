#!/bin/bash
set -e

APP_NAME=<%= appName %>
APP_PATH=/opt/$APP_NAME
PUBLISHED_PORT=<%= publishedPort %>
TARGET_PORT=<%= targetPort %>
ENV_FILE=$APP_PATH/config/env.list
IMAGE=mup-<%= appName.toLowerCase() %>:latest
REPLICAS=<%= replicas %>

docker service rm $APP_NAME

docker service create \
  --env-file=$ENV_FILE \
  --name $APP_NAME \
  --publish=$PUBLISHED_PORT:$TARGET_PORT \
  --hostname="$HOSTNAME-$APP_NAME" \
  --replicas=$REPLICAS \
  --constraint="node.labels.mup-app-${APP_NAME} == true" \
  $IMAGE
