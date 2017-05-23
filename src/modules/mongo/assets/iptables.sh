#!/usr/bin/env bash

# Usage:
# timeout 10 docker_iptables.sh
#
# Use the builtin shell timeout utility to prevent infinite loop (see below)

if [ ! -x /usr/bin/docker ]; then
    exit
fi
#clean PRE_DOCKER
iptables -F PRE_DOCKER
iptables --delete FORWARD -o docker0 -j PRE_DOCKER

# Create a PRE_DOCKER table
iptables -N PRE_DOCKER

# Default action
iptables -I PRE_DOCKER -j DROP

# Docker Containers Public Admin access (insert your IPs here)
<% for(var key in ips) { %>
  iptables -I PRE_DOCKER -i eth0 -s <%- ips[key] %> -j ACCEPT
<% } %>

# Docker internal use
iptables -I PRE_DOCKER -o docker0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -I PRE_DOCKER -i docker0 ! -o docker0 -j ACCEPT
iptables -I PRE_DOCKER -m state --state RELATED -j ACCEPT
iptables -I PRE_DOCKER -i docker0 -o docker0 -j ACCEPT

# Docker container named www-nginx public access policy
WWW_IP_CMD="/usr/bin/docker inspect --format='{{.NetworkSettings.IPAddress}}' <%- name %>"
WWW_IP=$(/usr/bin/docker inspect --format='{{.NetworkSettings.IPAddress}}' <%- name %>)

# Double check, wait for docker socket (upstart docker.conf already does this)
#while [ ! -e "/var/run/docker.sock" ]; do echo "Waiting for /var/run/docker.sock..."; sleep 1; done

# Wait for docker web server container IP
#while [ -z "$WWW_IP" ]; do echo "Waiting for www-nginx IP..."; WWW_IP=$($WWW_IP_CMD); done

# Insert web server container filter rules
<% for(var key in localServers) { %>
  WWW_IP=$(/usr/bin/docker inspect --format='{{.NetworkSettings.IPAddress}}' <%- localServers[key] %>)
  iptables -I PRE_DOCKER -i eth0 -p tcp -d $WWW_IP --dport 80  -j ACCEPT
  iptables -I PRE_DOCKER -i eth0 -p tcp -d $WWW_IP --dport 443 -j ACCEPT
<% } %>


# Finally insert the PRE_DOCKER table before the DOCKER table in the FORWARD chain.
iptables -I FORWARD -o docker0 -j PRE_DOCKER