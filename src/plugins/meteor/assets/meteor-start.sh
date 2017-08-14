#!/bin/bash

set -e

APP_DIR=/opt/<%=appName %>
IMAGE=mup-<%= appName %>

# save the last known version
cd $APP_DIR
if docker image inspect $IMAGE:latest >/dev/null; then
  echo "using image"
  sudo rm -rf current
else
  echo "using bundle"
  sudo rm -rf last
  sudo mv current last || true

  # setup the new version
  sudo mkdir current
  sudo cp tmp/bundle.tar.gz current/

  docker rmi $IMAGE:previous || true
fi

if docker image inspect $IMAGE:previous >/dev/null; then
  echo "removing last"
  sudo rm -rf last
fi

# start app
sudo bash config/start.sh 
