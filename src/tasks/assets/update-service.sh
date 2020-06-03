#!/bin/bash
set -e
set -x
set -v

NAME="<%= name %>"

sudo docker service update \
  <%= image ? `--image ${image}` : '' %> \
  <%- envAdd.length ? envAdd.map(env => `--env-add=${env.name}=${env.value}`).join(' ') : '' %> \
  <%- envRemove.length ? envRemove.map(env => `--env-rm=${env.name}`).join(' ') : '' %> \
  <%- hostname ? `--hostname="${hostname}"` : '' %> \
  <%- endpointMode ? `--endpoint-mode=${endpointMode}` : '' %> \
  <%- updateFailureAction ? `--update-failure-action=${updateFailureAction}` : '' %> \
  <%- updateParallelism ? `--update-parallelism=${updateParallelism}` : '' %> \
  <%- updateDelay ? `--update-delay=${updateDelay}` : '' %> \
  $NAME
