#!/bin/bash

APPNAME=<%= appName %>

sudo docker rm -f $APPNAME || :
sudo docker rm -f $APPNAME-frontend || :
sudo docker rm -f $APPNAME-nginx-letsencrypt || :
sudo docker rm -f $APPNAME-nginx-proxy || :

sudo docker network disconnect bridge -f $APPNAME || :
sudo docker network disconnect bridge -f $APPNAME-frontend || :
sudo docker network disconnect bridge -f $APPNAME-nginx-letsencrypt || :
sudo docker network disconnect bridge -f $APPNAME-nginx-proxy || :
