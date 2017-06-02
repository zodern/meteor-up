#!/bin/bash
export LANG=en
export MOCHA_PARALLEL="${MOCHA_PARALLEL:-2}"
export PORT=3400

command -v parallel >/dev/null 2>&1 || { sudo apt-get -qq -y install parallel; }

source ./tests/setup.sh

#running a single test
function run_test {
    export PORT=`expr $PORT + $PARALLEL_SEQ`
    DOCKER_ID=$( docker run -v $MUP_DIR/tests/ssh/new.pub:/root/.ssh/authorized_keys -p 0.0.0.0:$PORT:22 --privileged=true -d -t mup-tests-server /sbin/my_init )
    sleep 5
    export PROD_SERVER_USER=root
    export PROD_SERVER="0.0.0.0"
    export PROD_SERVER_PORT=$PORT
    export PROD_SERVER_PEM=$MUP_DIR/tests/ssh/new
    cd $MUP_DIR
    npm test -- -g $1
     docker rm -f $( docker stop $DOCKER_ID) > /dev/null
}
export -f run_test

parallel --progress -j $MOCHA_PARALLEL run_test ::: </tmp/tests/tests.list
