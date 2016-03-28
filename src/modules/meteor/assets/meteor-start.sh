#!/bin/bash

set -e

APP_DIR=/opt/<%=appName %>

# save the last known version
cd $APP_DIR
if [[ -d current ]]; then
  sudo rm -rf last
  sudo mv current last
fi

# setup the new version
sudo mkdir current
sudo cp tmp/bundle.tar.gz current/

# start app
sudo bash config/start.sh 
