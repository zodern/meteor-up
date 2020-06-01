#!/bin/bash

sudo mkdir -p /opt/<%= name %>/
sudo mkdir -p /opt/<%= name %>/certs
sudo mkdir -p /opt/<%= name %>/mounted-certs
sudo mkdir -p /opt/<%= name %>/upstream
sudo mkdir -p /opt/<%= name %>/config
sudo mkdir -p /opt/<%= name %>/config/vhost.d
sudo mkdir -p /opt/<%= name %>/config/html
sudo mkdir -p /opt/<%= name %>/config/htpasswd

sudo touch /opt/<%= name %>/config/shared-config.sh
sudo touch /opt/<%= name %>/config/env.list
sudo touch /opt/<%= name %>/config/env_letsencrypt.list

# Custom Certificates expect the app's folder to already exist
sudo mkdir -p /opt/<%= appName %>/config

sudo chown ${USER} /opt/<%= name %> -R
sudo chown ${USER} /opt/<%= appName %> -R

if docker network inspect mup-proxy ; then
    echo "Network already exists"
else
    # this only works when using swarm
    docker network create \
      --attachable \
      --driver overlay \
      mup-proxy || true
fi
