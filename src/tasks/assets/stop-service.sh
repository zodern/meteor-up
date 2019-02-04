#!/bin/bash
set -e

NAME=<%= name %>

docker service rm $NAME || true
