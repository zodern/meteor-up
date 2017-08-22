#!/bin/bash

APPNAME=<%= name %>
PROXYNAME=<%= proxyName%>

# The shared proxy's certs folder contains custom certs for all apps on the server
# We want to remove the certs belonging to this app, including any
# for domains that were removed from the configuration.
#
# To know which belong to this app, we have two copies of the cert for each domain
# The first one is a symlink in /opt/$PROXYNAME/certs to the uploaded cert.
# The second is in /opt/$PROXYNAME/mounted-certs, and is the one used by the proxy
#
# By deleting the uploaded cert, we know that the brocken symlinks are the ones belonging
# to this app. We then delete both copies of the cert.
# Later they will be recreated for any domains still in the configuration.

sudo rm -rf /opt/$APPNAME/config/bundle.crt
sudo rm -rf /opt/$APPNAME/config/private.key

# Remove broken cert symlinks
cd /opt/$PROXYNAME/certs
find -L . -name . -o -type d -prune -o -type l -exec rm '{}' ../mounted-certs/'{}' \;
