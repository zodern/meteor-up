#!/bin/bash

docker node promote \
    <% for(var index in nodeIds) { %> \
    <%= nodeIds[index] %> \
    <% } %> \
