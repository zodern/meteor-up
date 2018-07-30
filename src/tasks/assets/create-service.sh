#!/bin/bash
set -e
set -x
set -v

NAME=<%= name %>
PUBLISHED_PORT=<%= publishedPort %>
TARGET_PORT=<%= targetPort %>
ENV_FILE=<%= envFile %>
IMAGE=<%= image %>
HOSTNAME=<%= hostname %>
IMAGE=<%= image %>
ENDPOINT_MODE=<%= endpointMode %>

docker service create \
  <%- endpointMode !== 'dnsrr' ? '--publish=$PUBLISHED_PORT:$TARGET_PORT' : '' %> \
  <%- envFile ? '--env-file=' + envFile : '' %> \
  <%- env ? Object.keys(env).map(key => `--env ${key}=${env[key]} `).join(' ') : '' %> \
  <%- networks.length ? networks.map(network => `--network ${network}`).join (' ') : '' %> \
  --name $NAME \
  <%- hostname ? '--hostname=' + hostname : '' %> \
  <%- mode === 'replicated' ? '--replicas=' + replicas : '--mode=global' %> \
  --endpoint-mode $ENDPOINT_MODE \
  $IMAGE
