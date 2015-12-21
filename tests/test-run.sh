#!/bin/bash

#seting up env
cd ~/meteor-up/tests
eval `ssh-agent`
ssh-add new
PROD_SERVER=$(docker inspect -format '{{ .NetworkSettings.IPAddress }}' 'mydoc')
PROD_SERVER_USER=root
cd ~/meteor-up
cp -rf ~/meteor-up/tests /tmp
npm install
npm link

#running tests
npm test
