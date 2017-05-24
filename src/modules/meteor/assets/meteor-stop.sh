#!/bin/bash

APPNAME=<%= appName %>

sudo docker network disconnect -f bridge $APPNAME || :
sudo docker rm -f $APPNAME || :
sudo docker network disconnect -f bridge $APPNAME-frontend || :
sudo docker rm -f $APPNAME-frontend || :
sudo docker network disconnect bridge -f $APPNAME || :
sudo docker network disconnect bridge -f $APPNAME-frontend || :
