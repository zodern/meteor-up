#!/bin/bash

APPNAME=<%= appName %>

sudo docker rm -f $APPNAME || :
sudo docker rm -f $APPNAME-frontend || :
sudo docker network disconnect bridge -f $APPNAME || :
sudo docker network disconnect bridge -f $APPNAME-frontend || :
