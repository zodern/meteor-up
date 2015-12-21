#!/bin/bash

#seting up env
cd ~/meteor-up/tests
eval `ssh-agent`
ssh-add new
export PROD_SERVER=$(docker inspect -format '{{ .NetworkSettings.IPAddress }}' 'mydoc')
export PROD_SERVER_USER=root
cd ~/meteor-up

#running tests
npm test
