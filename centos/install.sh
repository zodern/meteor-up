#!/bin/bash

#manual
sudo mkdir -p /opt/mongodb
sudo chown ${USER} /opt/mongodb -R
sudo mkdir -p /var/lib/mongodb
sudo mkdir -p /opt/app/
sudo mkdir -p /opt/app/config
sudo mkdir -p /opt/app/tmp
sudo chown ${USER} /opt/app -R


#docker
# Remove the lock
set +e
sudo rm /var/lib/dpkg/lock > /dev/null
sudo rm /var/cache/apt/archives/lock > /dev/null
sudo dpkg --configure -a
set -e

# Required to update system
sudo yum update

# Install docker
wget -qO- https://get.docker.com/ | sudo sh
sudo usermod -a -G docker ${USER}
sudo service docker start || sudo service docker restart



#mongo
#sudo mkdir -p /opt/mongodb
#sudo chown ${USER} /opt/mongodb -R

MONGO_VERSION=3.4.1

set -e
# we use this data directory for the backward compatibility
# older mup uses mongodb from apt-get and they used this data directory
#sudo mkdir -p /var/lib/mongodb

sudo docker pull mongo:$MONGO_VERSION
set +e
docker update --restart=no mongodb
docker exec mongodb mongod --shutdown
sleep 2
sudo docker rm -f mongodb
set -e

sudo docker run \
    -d \
    --restart=always \
    --publish=127.0.0.1:27017:27017 \
    --volume=/var/lib/mongodb:/data/db \
    --volume=/opt/mongodb/mongodb.conf:/mongodb.conf \
    --name=mongodb \
    mongo:$MONGO_VERSION mongod -f /mongodb.conf



#meteor
#sudo mkdir -p /opt/app/
#sudo mkdir -p /opt/app/config
#sudo mkdir -p /opt/app/tmp
#sudo chown ${USER} /opt/app -R

set -e

APP_DIR=/opt/app

# save the last known version
cd $APP_DIR
if [[ -d current ]]; then
  sudo rm -rf last
  sudo mv current last
fi

APPNAME=app
# setup the new version
sudo mkdir current
sudo cp $APP_DIR/tmp/bundle.tar.gz $APP_DIR/current/


#meteor app docker
APPNAME=app2
CLIENTSIZE=10M
APP_PATH=/opt/$APPNAME
BUNDLE_PATH=$APP_PATH/current
ENV_FILE=$APP_PATH/config/env.list
PORT=80
BIND=0.0.0.0
NGINX_PROXY_VERSION=latest
LETS_ENCRYPT_VERSION=latest

# Remove previous version of the app, if exists
#docker rm -f $APPNAME

# Remove frontend container if exists
#docker rm -f $APPNAME-frontend
#docker network disconnect bridge -f $APPNAME-frontend
#echo "Removed $APPNAME-frontend"


# Remove let's encrypt containers if exists
#docker rm -f $APPNAME-nginx-letsencrypt
#docker network disconnect bridge -f $APPNAME-nginx-letsencrypt
#echo "Removed $APPNAME-nginx-letsencrypt"

#docker rm -f $APPNAME-nginx-proxy
#docker network disconnect bridge -f $APPNAME-nginx-proxy
#echo "Removed $APPNAME-nginx-proxy"

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull abernix/meteord:base
set -e
echo "Pulled abernix/meteord:base"

docker run \
  -d \
  --restart=always \
  --publish=$BIND:$PORT:80 \
  --volume=$BUNDLE_PATH:/bundle \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  --link=mongodb:mongodb --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME \
  --name=$APPNAME \
  abernix/meteord:base
echo "Ran abernix/meteord:base"
sleep 15s
