#!/bin/bash

APP_NAME=<%= appName %>
IMAGE=<%= imagePrefix %><%= appName.toLowerCase() %>

<% for(version of versions) { %>
  docker rmi $IMAGE:<%- version %>
<% } %>
