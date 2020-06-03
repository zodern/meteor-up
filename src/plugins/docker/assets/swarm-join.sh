#!/bin/bash

sudo docker swarm join --token <%= token %> <%= managerIP %>
