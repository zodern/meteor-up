#!/bin/bash
APP_CERTS=/opt/<%= appName%>/config
PROXY_CERTS=/opt/<%= proxyName %>/certs
MOUNTED_CERTS=/opt/<%= proxyName %>/mounted-certs

<% for(var i = 0; i < domains.length; i++) { %>
  DOMAIN=<%= domains[i] %>
  ln -s $APP_CERTS/bundle.crt $PROXY_CERTS/$DOMAIN.crt
  ln -s $APP_CERTS/private.key $PROXY_CERTS/$DOMAIN.key

  cp $APP_CERTS/bundle.crt $MOUNTED_CERTS/$DOMAIN.crt
  cp $APP_CERTS/private.key $MOUNTED_CERTS/$DOMAIN.key
<% } %>

