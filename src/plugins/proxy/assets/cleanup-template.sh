#!/bin/bash

APPNAME=<%= appName %>

rm /opt/$APPNAME/config/nginx-shared.tmpl || true
