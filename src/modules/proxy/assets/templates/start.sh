#!/bin/bash

APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
ENV_FILE=$APP_PATH/config/env.list
ENV_FILE_LETSENCRYPT=$APP_PATH/config/env_letsencrypt.list
HTTP_PORT=<%= httpPort %>

# Remove previous version of the app, if exists
docker rm -f $APPNAME
docker network disconnect bridge -f $APPNAME
echo "Removed $APPNAME"

# Remove let's encrypt containers if exists
docker rm -f $APPNAME-letsencrypt
docker network disconnect bridge -f $APPNAME-nginx-proxy
echo "Removed $APPNAME-letsencrypt"

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull jrcs/letsencrypt-nginx-proxy-companion:latest
docker pull jwilder/nginx-proxy
set -e
echo "Pulled jwilder/nginx-proxy and jrcs/letsencrypt-nginx-proxy-companion"

<% if(typeof clientUploadLimit === 'number') { %>
# This updates nginx for all vhosts
sudo cat <<EOT > /opt/$APPNAME/config/nginx-default.conf
client_max_body_size <%= clientUploadLimit %>;
EOT
<% } %>


docker run -d -p $HTTP_PORT:80 \
  <% if(httpsPort) { %> \
 -p <%= httpsPort %>:443 \
  <% } %> \
  --name $APPNAME \
  --env-file=$ENV_FILE \
  --restart=always\
  -v /opt/$APPNAME/mounted-certs:/etc/nginx/certs \
  -v /opt/$APPNAME/config/vhost.d:/etc/nginx/vhost.d \
  -v /opt/$APPNAME/config/html:/usr/share/nginx/html \
  <% if(typeof clientUploadLimit === 'number') { %> \
  -v /opt/$APPNAME/config/nginx-default.conf:/etc/nginx/conf.d/my_proxy.conf:ro \
  <% } %> \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  jwilder/nginx-proxy
echo "Ran nginx-proxy as $APPNAME"

sleep 2s
docker run -d \
  --name $APPNAME-letsencrypt \
  --env-file=$ENV_FILE_LETSENCRYPT \
  --restart=always \
  --volumes-from $APPNAME \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  jrcs/letsencrypt-nginx-proxy-companion
echo "Ran jrcs/letsencrypt-nginx-proxy-companion"

