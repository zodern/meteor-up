set -e

<% for(const [ name, value ] of Object.entries(keyHashes)) { %>
if [ $(sudo cat /opt/.mup-setup/<%- name %>.txt) != "<%- value %>" ]; then
  exit 1
fi
<% } %>

<% for(const service of services) { %>
sudo service <%- service %> status
<% } %>

<% for (const container of containers) { %>
STATUS="$(sudo docker inspect --format='{{.State.Running}}' <%- container %> 2> /dev/null)"
if [ "$STATUS" == 'false' ] || [ -z "$STATUS" ]; then
  exit 1
fi
<% } %>
