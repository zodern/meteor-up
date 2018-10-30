#!/bin/bash

<% if (typeof dockerArgs === "object") { %> \
  echo <% for (var args in dockerArgs) { %> <%- dockerArgs[args] %> <% } %>
<% } %>
