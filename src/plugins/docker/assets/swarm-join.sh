#!/bin/bash

docker swarm join --token <%= token %> <%= managerIP %>
