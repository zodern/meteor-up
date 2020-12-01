# Use phusion/baseimage as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/baseimage-docker/blob/master/Changelog.md for
# a list of version numbers.
FROM phusion/baseimage:18.04-1.0.0

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]
#Install wget
RUN apt-get update >/dev/null && \
  apt-get -y install \
    tree \
    curl \
    sudo \
    netcat \
    lxc \
    iptables \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common >/dev/null && \
  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#Enable ssh
RUN rm -f /etc/service/sshd/down

COPY ./docker.conf /etc/init.d/docker
RUN chmod +x /etc/init.d/docker && \
  update-rc.d docker defaults

RUN groupadd -r normal-user && \
    useradd -s /bin/bash -r -g normal-user normal-user && \
    adduser normal-user sudo && \
    mkdir -p /home/normal-user/.ssh && \
    chown -R normal-user:normal-user /home/normal-user/.ssh && \
    echo normal-user:password | chpasswd && \
    echo '%sudo ALL=(ALL) NOPASSWD:ALL' | sudo EDITOR='tee -a' visudo

#Expose ssh port
EXPOSE 22
