#!/bin/bash

sudo mkdir -p /opt/<%= name %>/
sudo mkdir -p /opt/<%= name %>/config
sudo mkdir -p /opt/<%= name %>/tmp
sudo cat <<EOT >> /opt/<%= name %>/config/nginx-default.conf
{
  client_max_body_size 100m;
}
EOT
sudo chown ${USER} /opt/<%= name %> -R
