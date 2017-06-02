#!/bin/bash

sudo mkdir -p /opt/<%= name %>/
sudo mkdir -p /opt/<%= name %>/certs
sudo mkdir -p /opt/<%= name %>/mounted-certs
sudo mkdir -p /opt/<%= name %>/config
sudo mkdir -p /opt/<%= name %>/config/vhost.d
sudo mkdir -p /opt/<%= name %>/config/html
sudo chown ${USER} /opt/<%= name %> -R
