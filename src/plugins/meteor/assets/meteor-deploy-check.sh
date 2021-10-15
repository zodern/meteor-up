#!/bin/bash
exec 2>&1

APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
IMAGE=<%= imagePrefix %><%= appName.toLowerCase() %>
START_SCRIPT=$APP_PATH/config/start.sh
DEPLOY_CHECK_WAIT_TIME=<%= deployCheckWaitTime %>

# Check if using host network.
$(sudo docker inspect $APPNAME --format "{{(index .NetworkSettings.Networks)}}" | grep -q '\[host')
HOST_NETWORK=$?

cd $APP_PATH

revert_app () {
  echo "=> Container status:"
  sudo docker inspect $APPNAME --format "restarted: {{.RestartCount}} times {{json .NetworkSettings}} {{json .State}}"
  echo ""
  echo ""
  echo "=================================="
  echo "=> App Logs:" 1>&2
  sudo docker logs --tail=100 $APPNAME 1>&2

  <% if (canRollback) { %>
    # Record that the version failed
    FAILED_VERSION=$(tail -1 /opt/$APPNAME/config/version-history.txt) || ''
    PREVIOUS_VERSION=$(tail -n 2 /opt/$APPNAME/config/version-history.txt | head -1) || ''

    # Make sure we can roll back using a versioned image
    if [ -n "$FAILED_VERSION" ] && [ -n "$PREVIOUS_VERSION" ]; then
      <% if (recordFailed) { %>
        # TODO: limit how large this file can grow
        echo "$FAILED_VERSION" >> /opt/$APPNAME/config/failed-versions.txt
      <% } %>

      # Remove last line so we don't rollback to the failed version
      head -n -1 /opt/$APPNAME/config/version-history.txt > /opt/$APPNAME/config/version-history.tmp.txt 
      mv /opt/$APPNAME/config/version-history.tmp.txt /opt/$APPNAME/config/version-history.txt

      sudo bash $START_SCRIPT > /dev/null 2>&1
      echo " " 1>&2
      echo "=> Redeploying previous version of the app" 1>&2
      echo " " 1>&2

    # If the versioned image isn't available, check if there is a previous image
    elif sudo docker image inspect $IMAGE:latest >/dev/null; then
      sudo docker tag $IMAGE:previous $IMAGE:latest

      <% if (privateRegistry) { %>
        sudo docker push $IMAGE:latest
        docker image prune -f
      <% } %>

      echo "latest" > /opt/$APPNAME/config/version-history.txt
      sudo bash $START_SCRIPT > /dev/null 2>&1

      echo " " 1>&2
      echo "=> Redeploying previous version of the app" 1>&2
      echo " " 1>&2

    elif [ -d last ]; then
      rm /opt/$APPNAME/config/version-history.txt
      sudo mv last current
      sudo bash $START_SCRIPT > /dev/null 2>&1

      echo " " 1>&2
      echo "=> Redeploying previous version of the app" 1>&2
      echo " " 1>&2
    fi
  <% } %>
}

finish () {
  # TODO: if canRollback is true, remove version from failed list
  exit 0
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
    # Only works when the container is connected to the bridge network
    # We had tried only using .NetworkSettings.Networks.IpAddress, but
    # for some apps it would provide an IP address that the app did not
    # load on (see issue #1110)
    CONTAINER_IP=$(sudo docker inspect --format '{{ .NetworkSettings.IPAddress }}' $APPNAME )

    # If the container is not on the bridge network,
    # check for an IP Address on other networks
    if [ -z "$CONTAINER_IP" ]; then
      echo "CONTAINER IP EMPTY"
      CONTAINER_IP=$(sudo docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}
{{end}}' $APPNAME | head -n 1)
    fi
  fi

  echo "IP: $CONTAINER_IP"

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
    --silent \
    --show-error \
    $DEPLOY_CHECK_URL \
    && exit 0
done
