FROM mup-tests-server
RUN apt-get update
RUN apt-get -y install lxc iptables && \
    curl https://get.docker.com/ | sh && usermod -aG docker $(whoami)
RUN echo 'DOCKER_OPTS="--storage-driver=vfs"' >> /etc/default/docker