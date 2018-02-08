#!/bin/bash

<% for(var index in toAdd) { %>
docker node update <%- toAdd[index].server %> \
    --label-add <%- toAdd[index].label %>=<%- toAdd[index].value %>
<% } %>

<% for(var index in toRemove) { %>
docker node update <%- toRemove[index].server %> \
    --label-rm <%- toRemove[index].label %>
<% } %>
