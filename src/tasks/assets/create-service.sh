#!/bin/bash
set -e
set -x

NAME=<%= name %>
PUBLISHED_PORT=<%= publishedPort %>
TARGET_PORT=<%= targetPort %>
ENV_FILE=<%= envFile %>
IMAGE=<%= image %>
HOSTNAME=<%= hostname %>
IMAGE=<%= image %>

docker service create \
  --publish=$PUBLISHED_PORT:$TARGET_PORT \
  <%= envFile ? '--env-file=' + envFile : '' %> \
  <%= env ? Object.keys(env).map(key => `--env ${key}=${env[key]} `).join(' ') : '' %> \
  --name $NAME \
  <%= hostname ? '--hostname=' + hostname : '' %> \
  <%= mode === 'replicated' ? '--replicas=' + replicas : '--mode=global' %> \
  $IMAGE
