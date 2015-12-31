import path from 'path';
import debug from 'debug';
import nodemiral from 'nodemiral';
import {runTaskList, getDockerLogs} from '../utils';
import * as docker from '../docker/';
const log = debug('mup:module:mongo');

export function dump(/* api */) {
  log('exec => mup mongo dump');
}

export function help(/* api */) {
  log('exec => mup mongo help');
}

export function logs(api) {
  log('exec => mup mongo logs');

  const args = api.getArgs();
  const sessions = api.getSessions([ 'mongo' ]);
  return getDockerLogs('mongodb', sessions, args);
}

export function setup(api) {
  log('exec => mup mongo setup');
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
  log('exec => mup mongo start');
  const list = nodemiral.taskList('Start Mongo');

  list.executeScript('start mongo', {
    script: path.resolve(__dirname, 'assets/mongo-start.sh')
  });

  const sessions = api.getSessions([ 'mongo' ]);
  return runTaskList(list, sessions);
}

export function stop(api) {
  log('exec => mup mongo stop');
  const list = nodemiral.taskList('Stop Mongo');

  list.executeScript('stop mongo', {
    script: path.resolve(__dirname, 'assets/mongo-stop.sh')
  });

  const sessions = api.getSessions([ 'mongo' ]);
  return runTaskList(list, sessions);
}
