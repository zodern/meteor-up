#!/bin/bash
set -e
docker info
limit=20
elaspsed=0

# If this node was just promoted, it could take a couple of seconds
# for it to finish becoming a manager.
while [[ true ]]; do

  sudo docker node demote \
    <% for(var index in nodeIds) { %> \
    <%= nodeIds[index] %> \
    <% } %> \
    && exit 0

  sleep 1
  elaspsed=$((elaspsed+1))
  
  if [ "$elaspsed" "==" "$limit" ]; then
    echo "Failed demoting node" 1>&2 
    exit 1
  fi
done
