#!/bin/bash

sudo docker node promote \
    <% for(var index in nodeIds) { %> \
    <%= nodeIds[index] %> \
    <% } %> \
