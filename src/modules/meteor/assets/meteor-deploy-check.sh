APPNAME=<%= appName %>
APP_PATH=/opt/$APPNAME
START_SCRIPT=$APP_PATH/config/start.sh
DEPLOY_CHECK_WAIT_TIME=<%= deployCheckWaitTime %>
DEPLOY_CHECK_URL=<%= `localhost:${deployCheckPort}${deployCheckPath}` %>
HOST=<%= host %>

echo $DEPLOY_CHECK_URL

cd $APP_PATH

revert_app (){
  docker logs --tail=50 $APPNAME 1>&2
  if [ -d last ]; then
    sudo mv last current
    sudo bash $START_SCRIPT > /dev/null 2>&1

    echo " " 1>&2
    echo "=> Redeploying previous version of the app" 1>&2
    echo " " 1>&2
  fi
  
  echo 
  echo "To see more logs type 'mup logs --tail=50'"
  echo ""
}

elaspsed=0
while [[ true ]]; do
  sleep 1
  elaspsed=$((elaspsed+1))

  # Since this failing causes the app to rollback, it should only
  # fail because of a problem with the app, not from problems with the config.
  #
  # --fail Before the app is started, nginx returns an error page. Without this, it would take that as meaning the app was running
  # --L Follow redirects. Needed to still work when using --fail and redirected to https version
  # --insecure Without this, it would sometimes fail when ssl is set up
  curl \
    --fail \
    -L \
    --insecure \
    $DEPLOY_CHECK_URL \
    <% if (host) { %> --header "HOST:$HOST" <% } %>  \
    && exit 0

  if [ "$elaspsed" == "$DEPLOY_CHECK_WAIT_TIME" ]; then
    revert_app
    exit 1
  fi
done
 