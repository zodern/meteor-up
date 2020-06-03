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
UPDATE_FAILURE_ACTION=<%= updateFailureAction %>
UPDATE_PARALLELISM=<%= updateParallelism %>
UPDATE_DELAY=<%= updateDelay %>

sudo docker service create \
  <%- endpointMode !== 'dnsrr' ? '--publish=$PUBLISHED_PORT:$TARGET_PORT' : '' %> \
  <%- envFile ? '--env-file=' + envFile : '' %> \
  <%- env ? Object.keys(env).map(key => `--env ${key}=${env[key]} `).join(' ') : '' %> \
  <%- networks.length ? networks.map(network => `--network ${network}`).join (' ') : '' %> \
  <%- hostname ? '--hostname=' + hostname : '' %> \
  <%- mode === 'replicated' ? '--replicas=' + replicas : '--mode=global' %> \
  <%- constraints ? constraints.map(constraint => `--constraint '${constraint}'`).join(' ') : '' %> \
  --name $NAME \
  --endpoint-mode $ENDPOINT_MODE \
  --update-failure-action $UPDATE_FAILURE_ACTION \
  --update-parallelism $UPDATE_PARALLELISM \
  --update-delay $UPDATE_DELAY \
  $IMAGE
