#!/bin/bash
set -e

NAME="<%= name %>"

docker service update --force $NAME
