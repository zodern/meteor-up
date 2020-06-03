#!/bin/bash

set -e

APP_DIR=/opt/<%=appName %>
IMAGE=mup-<%= appName.toLowerCase() %>
PRIVATE_REGISTRY=<%- privateRegistry ? 0 : 1 %>

<% if (removeImage) { %>
echo "Removing images"
# Run when the docker image doesn't support prepare-bundle.sh.
# This command is only run during a deploy.
# Removes the latest image, so the start script will use the bundle instead
sudo docker rmi $IMAGE:latest || true
sudo docker images
<% } %>

# save the last known version
cd $APP_DIR
if sudo docker image inspect $IMAGE:latest >/dev/null || [ "$PRIVATE_REGISTRY" == "0" ]; then
  echo "using image"
  sudo rm -rf current || true
else
  echo "using bundle"
  sudo rm -rf last
  sudo mv current last || true

  # setup the new version
  sudo mkdir current
  sudo cp tmp/bundle.tar.gz current/

  sudo docker rmi $IMAGE:previous || true
fi

# TODO: clean up the last folder when the private registry has a previous image
if sudo docker image inspect $IMAGE:previous >/dev/null; then
  echo "removing last"
  sudo rm -rf last
fi

# start app
sudo bash config/start.sh
