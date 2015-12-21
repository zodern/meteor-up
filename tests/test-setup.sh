#!/bin/bash

curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs 
wget -qO- https://get.docker.com/ | sudo sh 
sudo service docker start 

cd ~/meteor-up/tests/
rm -rf new*
ssh-keygen -f new -t rsa -N ''
sudo docker rm -f mydoc
docker build -t mybase . 
sudo docker run --privileged=true -d --name 'mydoc' -t mybase /sbin/my_init

cd ~/meteor-up
npm install
npm link

cp -rf ~/meteor-up/tests /tmp
