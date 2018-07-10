#!/bin/bash

<% for(var index in toAdd) { %>
docker node update <%- toAdd[index].node %> \
    --label-add <%- toAdd[index].label %>=<%- toAdd[index].value %>
<% } %>

<% for(var index in toRemove) { %>
docker node update <%- toRemove[index].node %> \
    --label-rm <%- toRemove[index].label %>
<% } %>
