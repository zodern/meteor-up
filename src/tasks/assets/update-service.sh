#!/bin/bash
set -e
set -x
set -v

NAME="<%= name %>"
docker service update \
  <%= image ? `--image ${image}` : '' %> \
  <%- envAdd.length ? envAdd.map(env => `--env-add=${env.name}=${env.value}`).join(' ') : '' %> \
  <%- envRemove.length ? envRemove.map(env => `--env-rm=${env.name}`).join(' ') : '' %> \
  <%- hostname ? `--hostname="${hostname}"` : '' %> \
  $NAME
