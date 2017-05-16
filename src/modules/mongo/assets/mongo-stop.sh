#!/bin/bash
docker update --restart=no mongodb
docker exec mongodb mongod --shutdown
sleep 2
sudo docker rm -f mongodb
