#!/bin/bash

APPNAME=<%= appName %>

sudo docker rm -f $APPNAME || :
sudo docker rm -f $APPNAME-frontend || :
sudo docker network disconnect -f $APPNAME || :
sudo docker network disconnect -f $APPNAME-frontend || :
