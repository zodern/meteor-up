#!/bin/bash
set -e

NAME="<%= name %>"

sudo docker service update --force $NAME
