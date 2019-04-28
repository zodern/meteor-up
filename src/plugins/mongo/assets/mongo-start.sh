#!/bin/bash

MONGO_VERSION=<%= mongoVersion %>

set -e

sudo mkdir -p <%= mongoDbDir %>
sudo docker pull mongo:$MONGO_VERSION

set +e

sudo docker update --restart=no mongodb
sudo docker exec mongodb mongod --shutdown
sleep 2
sudo docker rm -f mongodb

set -e

echo "Running mongo:<%= mongoVersion %>"

sudo docker run \
  -d \
  --restart=unless-stopped \
  --publish=127.0.0.1:27017:27017 \
  --volume=<%= mongoDbDir %>:/data/db \
  --volume=/opt/mongodb/mongodb.conf:/mongodb.conf \
  --name=mongodb \
  --log-opt max-size=100m \
  --log-opt max-file=7 \
  mongo:$MONGO_VERSION mongod -f /mongodb.conf


echo "Creating replica set"

limit=20
elaspsed=0

while [[ true ]]; do
  sleep 1
  elaspsed=$((elaspsed+1))
  sudo docker exec mongodb mongo --eval \
    'rs.initiate({_id: "meteor", members: [{_id: 0, host: "127.0.0.1:27017"}]});' \
    && exit 0
  
  if [ "$elaspsed" "==" "$limit" ]; then
    echo "Failed connecting to mongo to create replica set" 1>&2 
    exit 1
  fi
done
