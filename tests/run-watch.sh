# Default regexp matches all tests
DEFAULT='[\s\S]+'
REGEX=${1:-$DEFAULT}

source ./tests/setup.sh
docker rm -f mup-test-server

DOCKER_ID=$(docker run -v $MUP_DIR/tests/ssh/new.pub:/root/.ssh/authorized_keys -p 0.0.0.0:3500:22 --privileged -d -t mup-tests-server-docker /sbin/my_init)
export PROD_SERVER_USER="root"
export PROD_SERVER="0.0.0.0"
export PROD_SERVER_PORT=3500
export PROD_SERVER_PEM=$MUP_DIR/tests/ssh/new
npm run test:custom-server -- --watch -g $REGEX || (docker rm -f $DOCKER_ID && exit 1)
docker rm -f $DOCKER_ID