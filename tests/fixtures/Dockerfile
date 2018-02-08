# Use phusion/baseimage as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/baseimage-docker/blob/master/Changelog.md for
# a list of version numbers.
FROM phusion/baseimage

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

#Install wget
RUN apt-get update
RUN apt-get -y install tree sudo netcat

#Enable ssh
RUN rm -f /etc/service/sshd/down

#Expose ssh port
EXPOSE 22

# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*