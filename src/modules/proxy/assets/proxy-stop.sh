#!/bin/bash

APPNAME=<%= appName %>

sudo docker rm -f $APPNAME || :
docker network disconnect bridge -f $APPNAME || :

sudo docker rm -f $APPNAME-letsencrypt || :
