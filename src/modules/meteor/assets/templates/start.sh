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
echo "Removed $APPNAME-frontend"

# Remove let's encrypt containers if exists
docker rm -f $APPNAME-nginx-letsencrypt
echo "Removed $APPNAME-nginx-letsencrypt"

docker rm -f $APPNAME-nginx-proxy
echo "Removed $APPNAME-nginx-proxy"

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull <%= docker.image %>
set -e
echo "Pulled <%= docker.image %>"

docker run \
  -d \
  --restart=always \
  <% if(typeof sslConfig === "object")  { %> \
  --expose=80 \
  <% } else { %> \
  --publish=$PORT:80 \
  <% } %> \
  --volume=$BUNDLE_PATH:/bundle \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  <% if(useLocalMongo)  { %>--link=mongodb:mongodb --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME <% } %>\
  <% if(logConfig && logConfig.driver)  { %>--log-driver=<%= logConfig.driver %> <% } %>\
  <% for(var option in logConfig.opts) { %>--log-opt <%= option %>=<%= logConfig.opts[option] %> <% } %>\
  <% for(var volume in volumes) { %>-v <%= volume %>:<%= volumes[volume] %> <% } %>\
  <% for(var args in docker.args) { %> <%= docker.args[args] %> <% } %>\
  <% if(sslConfig && typeof sslConfig.autogenerate === "object")  { %> \
    -e "VIRTUAL_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_EMAIL=<%= sslConfig.autogenerate.email %>" \
  <% } %> \
  --name=$APPNAME \
  <%= docker.image %>
echo "Ran <%= docker.image %>"
sleep 15s

<% if(typeof sslConfig === "object")  { %>

  <% if(typeof sslConfig.autogenerate === "object")  { %>
    # If using let's encrypt pull and setup the companion proxy
    echo "Running Autogenerate Proxy"
    # Get the nginx template for nginx-gen
    wget https://raw.githubusercontent.com/jwilder/nginx-proxy/master/nginx.tmpl -O /opt/$APPNAME/config/nginx.tmpl

    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    docker pull jrcs/letsencrypt-nginx-proxy-companion:latest
    docker pull jwilder/nginx-proxy
    set -e

    echo "Pulled autogenerate images"
    # proxy-frontend setup
    docker run -d -p 80:80 -p 443:443 \
      --restart=always \
      --name $APPNAME-nginx-proxy \
      -e "HTTPS_METHOD=noredirect" \
      -v /opt/$APPNAME/config/nginx-default.conf:/etc/nginx/conf.d/my_proxy.conf:ro \
      -v /opt/$APPNAME/config/certs:/etc/nginx/certs:ro \
      -v /opt/$APPNAME/config/vhost.d:/etc/nginx/vhost.d \
      -v /opt/$APPNAME/config/html:/usr/share/nginx/html \
      -v /var/run/docker.sock:/tmp/docker.sock:ro \
      jwilder/nginx-proxy
      echo "Ran nginx-proxy"
    sleep 15s


    # lets-encrypt proxy setup
    docker run -d \
      --name $APPNAME-nginx-letsencrypt \
      --restart=always\
      --volumes-from $APPNAME-nginx-proxy \
      -v /opt/$APPNAME/config/certs:/etc/nginx/certs:rw \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      jrcs/letsencrypt-nginx-proxy-companion
    echo "Ran jrcs/letsencrypt-nginx-proxy-companion"
  <% } else { %>
    # We don't need to fail the deployment because of a docker hub downtime
    echo "Running Regular Proxy"
    # Get the nginx template for nginx-gen
    wget https://raw.githubusercontent.com/jwilder/nginx-proxy/master/nginx.tmpl -O /opt/$APPNAME/config/nginx.tmpl

    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    docker pull jwilder/nginx-proxy
    set -e

    echo "Pulled autogenerate images"
    docker run -d -p 80:80 -p <%= sslConfig.port %>:443 \
      --restart=always \
      --name $APPNAME-nginx-proxy \
      -e "HTTPS_METHOD=noredirect" \
      -v /opt/$APPNAME/config/nginx-default.conf:/etc/nginx/conf.d/my_proxy.conf:ro \
      -v /opt/$APPNAME/config/bundle.crt:/etc/nginx/certs/bundle.crt:ro \
      -v /opt/$APPNAME/config/private.key:/etc/nginx/certs/private.key:ro \
      -v /opt/$APPNAME/config/vhost.d:/etc/nginx/vhost.d \
      -v /opt/$APPNAME/config/html:/usr/share/nginx/html \
      -v /var/run/docker.sock:/tmp/docker.sock:ro \
      jwilder/nginx-proxy
      echo "Ran nginx-proxy"
    sleep 15s
  <% } %>
<% } %>
