#!/bin/bash
set -e

NAME=<%= name %>

sudo docker service rm $NAME || true
