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
# We have to run the cleanup command in the docker container
# because the valid symlinks are only valid in the container
docker exec -w /etc/nginx/vhost.d/ mup-nginx-proxy find . -xtype l -delete

# Recreate them for the current domains
<% if(setUpstream) { %>
echo "Storing upstream"
cat <<"EOT" > /opt/$PROXYNAME/upstream/$APPNAME
<% if (stickySessions) { %>
ip_hash;
<% } %>
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
