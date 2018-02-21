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
VOLUME="--volume=$BUNDLE_PATH:/bundle"
LOCAL_IMAGE=false

sudo docker image inspect $IMAGE >/dev/null || IMAGE=<%= docker.image %>

if [ $IMAGE == $APP_IMAGE:latest  ]; then
  VOLUME=""
  LOCAL_IMAGE=true
fi

echo "Image" $IMAGE
echo "Volume" $VOLUME

# We want this message with the errors in stderr when shown to the user.
>&2 echo "Removing docker containers. Errors about nonexistent endpoints and containers are normal.";

# Remove previous version of the app, if exists
sudo docker rm -f $APPNAME

# Remove container network if still exists
sudo docker network disconnect bridge -f $APPNAME
<% for(var network in docker.networks) { %>
sudo docker network disconnect <%=  docker.networks[network] %> -f $APPNAME
<% } %>

# Remove frontend container if exists
sudo docker rm -f $APPNAME-frontend
sudo docker network disconnect bridge -f $APPNAME-frontend

# Remove let's encrypt containers if exists
sudo docker rm -f $APPNAME-nginx-letsencrypt
sudo docker network disconnect bridge -f $APPNAME-nginx-letsencrypt

sudo docker rm -f $APPNAME-nginx-proxy
sudo docker network disconnect bridge -f $APPNAME-nginx-proxy

>&2 echo "Finished removing docker containers"

# We don't need to fail the deployment because of a docker hub downtime
if [ $LOCAL_IMAGE == "false" ]; then
  set +e
  sudo docker pull <%= docker.image %>
  echo "Pulled <%= docker.image %>"
  set -e

else
  set -e
fi

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

<% if(typeof sslConfig === "object") { %>
   <% if(typeof sslConfig.autogenerate === "object")  { %>
    echo "Running autogenerate"
    # Get the nginx template for nginx-gen
    wget https://raw.githubusercontent.com/jwilder/nginx-proxy/master/nginx.tmpl -O /opt/$APPNAME/config/nginx.tmpl

    # Update nginx config based on user input or default passed by js
sudo cat <<EOT > /opt/$APPNAME/config/nginx-default.conf
client_max_body_size $CLIENTSIZE;
EOT

    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    sudo docker pull jrcs/letsencrypt-nginx-proxy-companion:$LETS_ENCRYPT_VERSION
    sudo docker pull jwilder/nginx-proxy:$NGINX_PROXY_VERSION
    set -e

    echo "Pulled autogenerate images"
    sudo docker run -d -p 80:80 -p 443:443 \
      --name $APPNAME-nginx-proxy \
      --restart=always \
      -e "DEFAULT_HOST=<%= sslConfig.autogenerate.domains.split(',')[0] %>" \
      -v /opt/$APPNAME/config/nginx-default.conf:/etc/nginx/conf.d/my_proxy.conf:ro \
      -v /opt/$APPNAME/certs:/etc/nginx/certs:ro \
      -v /opt/$APPNAME/config/vhost.d:/etc/nginx/vhost.d \
      -v /opt/$APPNAME/config/html:/usr/share/nginx/html \
      -v /var/run/docker.sock:/tmp/docker.sock:ro \
      jwilder/nginx-proxy:$NGINX_PROXY_VERSION
      echo "Ran nginx-proxy"
    sleep 15s

    sudo docker run -d \
      --name $APPNAME-nginx-letsencrypt \
      --restart=always\
      --volumes-from $APPNAME-nginx-proxy \
      -v /opt/$APPNAME/certs:/etc/nginx/certs:rw \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      jrcs/letsencrypt-nginx-proxy-companion:$LETS_ENCRYPT_VERSION
    echo "Ran jrcs/letsencrypt-nginx-proxy-companion"
    <% } else { %>
    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    sudo docker pull <%= docker.imageFrontendServer %>
    set -e
    sudo docker run \
      -d \
      --restart=always \
      --volume=/opt/$APPNAME/config/bundle.crt:/bundle.crt \
      --volume=/opt/$APPNAME/config/private.key:/private.key \
      --link=$APPNAME:backend \
      --publish=$BIND:<%= sslConfig.port %>:443 \
      --name=$APPNAME-frontend \
      <%= docker.imageFrontendServer %> /start.sh
  <% } %>
<% } %>

<% for(var network in docker.networks) { %>
  sudo docker network connect <%=  docker.networks[network] %> $APPNAME
<% } %>
