#!/bin/bash
APPNAME=<%= appName %>

# Remove nginx
sudo docker rm -f $APPNAME
sudo docker network disconnect bridge -f $APPNAME
sudo docker network disconnect mup-proxy -f $APPNAME
echo "Removed $APPNAME"

# Remove let's encrypt containers if exists
sudo docker rm -f $APPNAME-letsencrypt
sudo docker network disconnect bridge -f $APPNAME-letsencrypt
sudo docker network disconnect mup-proxy -f $APPNAME-letsencrypt
echo "Removed $APPNAME-letsencrypt"
