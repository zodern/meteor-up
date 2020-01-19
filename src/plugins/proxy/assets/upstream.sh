#!/bin/bash
APPNAME=<%= name %>
PROXYNAME=<%= proxyName%>

# We store the upstream config in the `upstream` folder
# and create symlinks in the `vhost.d` folder for each domain
# to the upstream config
# This allows us to know which domain configs are for the app by removing the
# upstream config and checking for broken symlinks in `vhost.d`

# Remove upstream config for all of app's domains
rm /opt/$PROXYNAME/upstream/$APPNAME
cd /opt/$PROXYNAME/config/vhost.d
find . -xtype l -delete

# Recreate them for the current domains
<% if(setUpstream) { %>
cat <<"EOT" > /opt/$PROXYNAME/upstream/$APPNAME
ip_hash;
<% for(var index in hostnames) { %>
server <%= hostnames[index] %>:<%= port %>;
<% } %>
EOT

cd /opt/$PROXYNAME/config/vhost.d

<% for(var index in domains) { %>
  ln -s ../upstream/$APPNAME ./<%= domains[index] %>_upstream
<% } %>
<% } %>

docker exec $PROXYNAME nginx -s reload || true
