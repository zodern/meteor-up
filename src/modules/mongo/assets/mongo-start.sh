#!/bin/bash

MONGO_VERSION=<%= mongoVersion %>

set -e
# we use this data directory for the backward compatibility
# older mup uses mongodb from apt-get and they used this data directory
sudo mkdir -p /var/lib/mongodb

sudo docker pull mongo:$MONGO_VERSION
set +e
docker update --restart=no mongodb
docker exec mongodb mongod --shutdown
sleep 2
sudo docker rm -f mongodb
set -e

echo "Running mongo:<%= mongoVersion %>"

<% if(typeof ipwhitelist === "object")  { %>
  sudo docker run \
    -d \
    --restart=always \
    --publish=0.0.0.0:27017:27017 \
    --volume=/var/lib/mongodb:/data/db \
    --volume=/opt/mongodb/mongodb.conf:/mongodb.conf \
    --name=mongodb \
    mongo:$MONGO_VERSION mongod -f /mongodb.conf
<% } else { %>
  sudo docker run \
    -d \
    --restart=always \
    --publish=127.0.0.1:27017:27017 \
    --volume=/var/lib/mongodb:/data/db \
    --volume=/opt/mongodb/mongodb.conf:/mongodb.conf \
    --name=mongodb \
    mongo:$MONGO_VERSION mongod -f /mongodb.conf
<% } %>