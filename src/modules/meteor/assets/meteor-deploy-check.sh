APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
START_SCRIPT=$APP_PATH/config/start.sh
DEPLOY_CHECK_WAIT_TIME=<%= deployCheckWaitTime %>
DEPLOY_CHECK_URL=<%= `localhost:${deployCheckPort}${deployCheckPath}` %>
HOST=<%= host %>

cd $APP_PATH

revert_app (){
  docker logs --tail=100 $APPNAME 1>&2
  if [ -d last ]; then
    sudo mv last current
    sudo bash $START_SCRIPT > /dev/null 2>&1

    echo " " 1>&2
    echo "=> Redeploying previous version of the app" 1>&2
    echo " " 1>&2
  fi
  
  echo 
  echo "To see more logs type 'mup logs --tail=100'"
  echo ""
}

elaspsed=0
while [[ true ]]; do
  sleep 1
  elaspsed=$((elaspsed+1))

  # Since this failing causes the app to rollback, it should only
  # fail because of a problem with the app, not from problems with the config.
  #
  # --insecure Without this, it would sometimes fail when ssl is set up
  curl \
    --insecure \
    $DEPLOY_CHECK_URL \
    <% if (host) { %> --header "HOST:$HOST" <% } %>  \
    && exit 0 

  if [ "$elaspsed" == "$DEPLOY_CHECK_WAIT_TIME" ]; then
    revert_app
    exit 1
  fi
done
 