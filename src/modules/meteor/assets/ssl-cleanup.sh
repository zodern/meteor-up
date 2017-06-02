#!/bin/bash

APPNAME=<%= name %>

sudo rm -rf /opt/$APPNAME/config/bundle.crt
sudo rm -rf /opt/$APPNAME/config/private.key
