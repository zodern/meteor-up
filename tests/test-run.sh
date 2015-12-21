#!/bin/bash

#installing services
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs
wget -qO- https://get.docker.com/ | sudo sh
sudo service docker start

#seting up env
cd ~/meteor-up/tests
ssh-keygen -f new -t rsa -N ''
eval `ssh-agent`
ssh-add new
docker build -t mybase .
sudo docker run --privileged=true -d --name 'mydoc' -t mybase /sbin/my_init
PROD_SERVER=$(docker inspect -format '{{ .NetworkSettings.IPAddress }}' 'mydoc')
PROD_SERVER_USER=root
cd ~/meteor-up
cp -rf ~/meteor-up/tests /tmp
npm install
npm link

#running tests
npm test
