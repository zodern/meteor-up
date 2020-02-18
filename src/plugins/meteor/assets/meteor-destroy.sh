#!/bin/bash
IMAGE=mup-<%= name.toLowerCase() %>

sudo rm -rf /opt/<%= name %>/

sudo docker rmi --force $IMAGE:previous
sudo docker rmi --force $IMAGE:latest
sudo docker rmi --force $IMAGE:build

sudo docker image prune -f
