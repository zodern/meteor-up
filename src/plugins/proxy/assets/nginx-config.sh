set -e

cd /opt/<%= proxyName %>/config/vhost.d
<% domains.forEach(function (domain) { %>
cat <<'CONFIG_EOT' > <%= domain %>
client_max_body_size <%= clientUploadLimit %>;
<%- serverConfig %>
CONFIG_EOT

  <% if (hasLocationConfig) { %>
cat <<'CONFIG_EOT' > <%= domain %>_location
<%- locationConfig %>
CONFIG_EOT
  <% } else { %>
    rm <%= domain%>_location || true
  <% } %>
<% }) %>
