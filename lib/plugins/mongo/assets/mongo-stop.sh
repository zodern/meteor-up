#!/bin/bash
sudo docker update --restart=no mongodb
sudo docker exec mongodb mongod --shutdown
sleep 2
sudo docker rm -f mongodb
