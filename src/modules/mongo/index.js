import { getDockerLogs, resolvePath, runTaskList } from '../utils';

import debug from 'debug';
import nodemiral from 'nodemiral';

const log = debug('mup:module:mongo');

export function dump() {
  log('exec => mup mongo dump');
}

export function help() {
  log('exec => mup mongo help');
}

export function logs(api) {
  log('exec => mup mongo logs');

  const args = api.getArgs();
  const sessions = api.getSessions(['mongo']);
  return getDockerLogs('mongodb', sessions, args);
}

export function setup(api) {
  log('exec => mup mongo setup');

  const mongoSessions = api.getSessions(['mongo']);
  const meteorSessions = api.getSessions(['meteor']);

  if (meteorSessions.length !== 1) {
    console.log(
      'To use mup inbuilt mongodb setup, you should have only one meteor app server. To have more app servers, use an external mongodb setup'
    );
    return;
  } else if (mongoSessions[0]._host !== meteorSessions[0]._host) {
    console.log(
      'To use mup inbuilt mongodb setup, you should have both meteor app and mongodb on the same server'
    );
    return;
  }

  const list = nodemiral.taskList('Setup Mongo');

  list.executeScript('setup environment', {
    script: resolvePath(__dirname, 'assets/mongo-setup.sh')
  });

  list.copy('copying mongodb.conf', {
    src: resolvePath(__dirname, 'assets/mongodb.conf'),
    dest: '/opt/mongodb/mongodb.conf'
  });

  const sessions = api.getSessions(['mongo']);

  return runTaskList(list, sessions);
}

export function start(api) {
  log('exec => mup mongo start');

  const mongoSessions = api.getSessions(['mongo']);
  const meteorSessions = api.getSessions(['meteor']);
  const config = api.getConfig().mongo;

  if (
    meteorSessions.length !== 1 ||
      mongoSessions[0]._host !== meteorSessions[0]._host
  ) {
    log('Skipping mongodb start. Incompatible config');
    return;
  }

  const list = nodemiral.taskList('Start Mongo');

  list.executeScript('start mongo', {
    script: resolvePath(__dirname, 'assets/mongo-start.sh'),
    vars: {
      mongoVersion: config.version || '3.4.1'
    }
  });

  const sessions = api.getSessions(['mongo']);
  return runTaskList(list, sessions);
}

export function stop(api) {
  log('exec => mup mongo stop');
  const list = nodemiral.taskList('Stop Mongo');

  list.executeScript('stop mongo', {
    script: resolvePath(__dirname, 'assets/mongo-stop.sh')
  });

  const sessions = api.getSessions(['mongo']);
  return runTaskList(list, sessions);
}
