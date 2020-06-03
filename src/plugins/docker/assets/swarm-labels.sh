#!/bin/bash

<% for(var index in toAdd) { %>
sudo docker node update <%- toAdd[index].node %> \
    --label-add <%- toAdd[index].label %>=<%- toAdd[index].value %>
<% } %>

<% for(var index in toRemove) { %>
sudo docker node update <%- toRemove[index].node %> \
    --label-rm <%- toRemove[index].label %>
<% } %>
