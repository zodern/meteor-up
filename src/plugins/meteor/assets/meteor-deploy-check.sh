#!/bin/bash

APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
IMAGE=mup-<%= appName.toLowerCase() %>
START_SCRIPT=$APP_PATH/config/start.sh
DEPLOY_CHECK_WAIT_TIME=<%= deployCheckWaitTime %>

# Check if using host network.
$(sudo docker inspect $APPNAME --format "{{(index .NetworkSettings.Networks)}}" | grep -q '\[host')
HOST_NETWORK=$?

cd $APP_PATH

revert_app () {
  echo "=> Container status:"
  sudo docker inspect $APPNAME --format "restarted: {{.RestartCount}} times {{json .NetworkSettings}} {{json .State}}"
  echo "=> Logs:"
  sudo docker logs --tail=100 $APPNAME 1>&2

  if sudo docker image inspect $IMAGE:previous >/dev/null 2>&1; then
    sudo docker tag $IMAGE:previous $IMAGE:latest
    sudo bash $START_SCRIPT > /dev/null 2>&1

    echo " " 1>&2
    echo "=> Redeploying previous version of the app" 1>&2
    echo " " 1>&2

  elif [ -d last ]; then
    sudo mv last current
    sudo bash $START_SCRIPT > /dev/null 2>&1

    echo " " 1>&2
    echo "=> Redeploying previous version of the app" 1>&2
    echo " " 1>&2
  fi

  echo
  echo "To see more logs type 'mup logs --tail=200'"
  echo ""
}

START_TIME=$(date +%s)
END_AT=$((START_TIME + $DEPLOY_CHECK_WAIT_TIME))
noIPCount=0
MAX_NO_IP_COUNT=10

while [[ true ]]; do
  if [ $(date +%s) -ge "$END_AT" ]; then
    revert_app
    exit 1
  fi

  sleep 1

  # If the container restarted, the ip address would have changed
  # Get the current ip address right before it is used
  if [[ $HOST_NETWORK == 0 ]]; then
    CONTAINER_IP="localhost"
  else
    CONTAINER_IP=$(sudo docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $APPNAME)
  fi

  if [[ -z $CONTAINER_IP ]]; then
    echo "Container has no IP Address, likely from the app crashing."
    noIPCount=$((noIPCount+1))

    if [ "$noIPCount" "==" "$MAX_NO_IP_COUNT" ]; then
      echo "Container spent too much time restarting." 1>&2
      revert_app
      exit 1
    fi

    continue
  fi

  DEPLOY_CHECK_URL=$CONTAINER_IP<%= `:${deployCheckPort}` %>

  # Since this failing causes the app to rollback, it should only
  # fail because of a problem with the app, not from problems with the config.
  #
  # --insecure Without this, it would sometimes fail when ssl is set up
  curl \
    --max-time 25 \
    --insecure \
    $DEPLOY_CHECK_URL \
    && exit 0
done
