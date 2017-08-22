#!/bin/bash

<% if (httpPort) { %>
export HTTP_PORT=<%= httpPort %>
<% } %>

<% if (httpsPort) { %>
export HTTPS_PORT=<%= httpsPort %>
<% } %>

<% if (clientUploadLimit) { %>
export CLIENT_UPLOAD_LIMIT=<%= clientUploadLimit %>
<% } %>