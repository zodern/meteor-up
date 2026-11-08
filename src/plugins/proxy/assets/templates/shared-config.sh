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

<% if (nginxProxyImage) { %>
export NGINX_PROXY_IMAGE=<%= nginxProxyImage %>
<% } %>

<% if (nginxProxyVersion) { %>
export NGINX_PROXY_VERSION=<%= nginxProxyVersion %>
<% } %>

<% if (letsencryptCompanionImage) { %>
export LETSENCRYPT_COMPANION_IMAGE=<%= letsencryptCompanionImage %>
<% } %>

<% if (letsencryptCompanionVersion) { %>
export LETSENCRYPT_COMPANION_VERSION=<%= letsencryptCompanionVersion %>
<% } %>
