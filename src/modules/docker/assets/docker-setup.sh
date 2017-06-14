#!/bin/bash

# TODO make sure we can run docker in this server

# Is docker already installed?
set +e
hasDocker=$(docker version | grep "version")
set -e

if [ ! "$hasDocker" ]; then
  # Remove the lock
  set +e
  sudo rm /var/lib/dpkg/lock > /dev/null
  sudo rm /var/cache/apt/archives/lock > /dev/null
  sudo dpkg --configure -a
  set -e

  # Required to update system
  sudo apt-get update
  sudo apt-get -y install wget lxc iptables curl

  # Install docker
  wget -qO- https://get.docker.com/ | sudo sh
  sudo usermod -a -G docker ${USER}

  sudo service docker start || sudo service docker restart
fi

# Start docker if it was stopped. If docker is already running, the exit code is 1
sudo service docker start || true

# TODO make sure docker works as expected
