#!/bin/bash

sudo mkdir -p /opt/<%= name %>/
sudo mkdir -p /opt/<%= name %>/config/htpasswd
sudo mkdir -p /opt/<%= name %>/tmp
sudo chown ${USER} /opt/<%= name %> -R
