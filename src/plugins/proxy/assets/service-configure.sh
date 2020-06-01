#!/bin/bash
set -e

APP_PATH=/opt/<%= appName %>
CONTAINER_NAME=mup-proxy-configure-<%= appName %>
PROXY_PATH=/opt/<%= proxyName %>

cd $APP_PATH/config

<% if (swarmEnabled) { %>
if ! sudo docker service inspect <%= appName %>; then
  echo "No service"
  sudo docker rm -f $CONTAINER_NAME || true
  <%- domains.map(domain => `rm $PROXY_PATH/config/vhost.d/${domain}_upstream || true`).join('\n') %>

  exit 0
fi

<% } %>

NEW_CONTENT="$(cat <<-CONFIG_EOT
#!/bin/bash
# VERSION=1

set -e

sudo docker rm -f mup-proxy-configure-<%= appName %> || true

sudo docker run \
  --name mup-proxy-configure-<%= appName %> \
  -d \
  --restart="always" \
  <%- swarmEnabled ? `-e "SWARM_SERVICE=${appName}"` : '' %> \
  -e "VIRTUAL_PORT=<%= imagePort %>" \
  <%- Object.keys(env).map(key => `-e "${key}=${env[key]}"`).join(' ') %> \
  busybox:1.28.4 tail -f /dev/null
CONFIG_EOT
)"

CURRENT_CONTENT=`cat proxy-config-container.sh || true`


if [ "$CURRENT_CONTENT" == "$NEW_CONTENT" ]; then
  echo "SAME CONTENT"
  if [ ! "$(sudo docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Config container not running. Starting container."
    bash proxy-config-container.sh
  fi
else
  echo "DIFFERENT CONTENT"
  echo "$NEW_CONTENT" > proxy-config-container.sh
  bash proxy-config-container.sh
fi
