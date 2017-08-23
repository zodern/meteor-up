#!/bin/bash

# TODO make sure we can run docker in this server

install_docker () {
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
}

minimumMajor=1
minimumMinor=13

# Is docker already installed?
set +e
hasDocker=$(sudo docker version | grep "version")
serverVersion=$(sudo docker version --format '{{.Server.Version}}')
parsedVersion=( ${serverVersion//./ })
majorVersion="${parsedVersion[0]}"
minorVersion="${parsedVersion[1]}"
echo $serverVersion
echo "Major" $majorVersion
echo "Minor" $minorVersion
set -e

if [ ! "$hasDocker" ]; then
  install_docker

elif [ "$minimumMajor" -gt "$majorVersion" ]; then
  echo "major wrong"
  install_docker

elif [ "$minimumMajor" -eq "$majorVersion" ] && [ "$minimumMinor" -gt "$minorVersion" ]; then
  echo "minor wrong"
  install_docker
else
  # Start docker if it was stopped. If docker is already running, the exit code is 1
  sudo service docker start || true
fi

# TODO make sure docker works as expected
