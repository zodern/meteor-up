#meteor
#sudo mkdir -p /opt/app/
#sudo mkdir -p /opt/app/config
#sudo mkdir -p /opt/app/tmp
#sudo chown ${USER} /opt/app -R

set -e

APP_DIR=/opt/app

# save the last known version
cd $APP_DIR
if [[ -d current ]]; then
  sudo rm -rf last
  sudo mv current last
fi

APPNAME=app
# setup the new version
sudo mkdir current
sudo cp $APP_DIR/tmp/bundle.tar.gz $APP_DIR/current/


#meteor app docker
APPNAME=app2
CLIENTSIZE=10M
APP_PATH=/opt/$APPNAME
BUNDLE_PATH=$APP_PATH/current
ENV_FILE=$APP_PATH/config/env.list
PORT=80
BIND=0.0.0.0
NGINX_PROXY_VERSION=latest
LETS_ENCRYPT_VERSION=latest

# Remove previous version of the app, if exists
#docker rm -f $APPNAME

# Remove frontend container if exists
#docker rm -f $APPNAME-frontend
#docker network disconnect bridge -f $APPNAME-frontend
#echo "Removed $APPNAME-frontend"


# Remove let's encrypt containers if exists
#docker rm -f $APPNAME-nginx-letsencrypt
#docker network disconnect bridge -f $APPNAME-nginx-letsencrypt
#echo "Removed $APPNAME-nginx-letsencrypt"

#docker rm -f $APPNAME-nginx-proxy
#docker network disconnect bridge -f $APPNAME-nginx-proxy
#echo "Removed $APPNAME-nginx-proxy"

# We don't need to fail the deployment because of a docker hub downtime
set +e
sudo docker pull abernix/meteord:base
set -e
echo "Pulled abernix/meteord:base"

sudo docker run \
  -d \
  --restart=always \
  --publish=$BIND:$PORT:80 \
  --volume=$BUNDLE_PATH:/bundle \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  --link=mongodb:mongodb --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME \
  --name=$APPNAME \
  abernix/meteord:base
echo "Ran abernix/meteord:base"
sleep 15s
