import path from 'path';
import nodemiral from 'nodemiral';
import {runTaskList} from '../utils';
import * as docker from '../docker/';

// export function dump(api) {
//
// }

export function help(/* api */) {
  console.log('TODO: mup mongo help');
}

// export function logs(api) {
//
// }

export function setup(api) {
  const list = nodemiral.taskList('Setup Mongo');

  list.executeScript('setup environment', {
    script: path.resolve(__dirname, 'assets/mongo-setup.sh')
  });

  list.copy('copying mongodb.conf', {
    src: path.resolve(__dirname, 'assets/mongodb.conf'),
    dest: '/opt/mongodb/mongodb.conf'
  });

  const sessions = api.getSessions([ 'mongo' ]);
  const apiForMongo = api.withSessions([ 'mongo' ]);

  return docker.setup(apiForMongo)
    .then(() => runTaskList(list, sessions));
}

export function start(api) {
  const list = nodemiral.taskList('Start Mongo');

  list.executeScript('start mongo', {
    script: path.resolve(__dirname, 'assets/mongo-start.sh')
  });

  const sessions = api.getSessions([ 'mongo' ]);
  return runTaskList(list, sessions);
}

export function stop(api) {
  const list = nodemiral.taskList('Stop Mongo');

  list.executeScript('stop mongo', {
    script: path.resolve(__dirname, 'assets/mongo-stop.sh')
  });

  const sessions = api.getSessions([ 'mongo' ]);
  return runTaskList(list, sessions);
}
