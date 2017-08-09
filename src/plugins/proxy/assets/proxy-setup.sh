#!/bin/bash

sudo mkdir -p /opt/<%= name %>/
sudo mkdir -p /opt/<%= name %>/certs
sudo mkdir -p /opt/<%= name %>/mounted-certs
sudo mkdir -p /opt/<%= name %>/config
sudo mkdir -p /opt/<%= name %>/config/vhost.d
sudo mkdir -p /opt/<%= name %>/config/html

touch /opt/<%= name %>/config/shared-config.sh
touch /opt/<%= name %>/config/env.list
touch /opt/<%= name %>/config/env_letsencrypt.list

sudo chown ${USER} /opt/<%= name %> -R
