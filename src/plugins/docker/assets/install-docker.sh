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
