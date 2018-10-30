#!/bin/bash

set -e

cd /opt/mongodb

# Make sure "mup setup" has been run since updating to mup 1.5
if [ ! -f ./mongo-start-new.sh ]; then
  echo 'Please run "mup mongo setup"' 1>&2
  exit 1
fi

NEW_CONTENT=`cat mongo-start-new.sh || true`
CURRENT_CONTENT=`cat mongo-start-current.sh || true`

# Only run the start script if the content changed, or
# the mongo container isn't running
if [ "$NEW_CONTENT" == "$CURRENT_CONTENT" ]; then
  echo "Same start script"

  if [ ! "$(docker ps -q -f name=mongodb)" ]; then
    bash mongo-start-current.sh
  fi
else
  echo "Different start script"
  rm mongo-start-current.sh || true
  cp mongo-start-new.sh mongo-start-current.sh
  bash mongo-start-current.sh
fi

