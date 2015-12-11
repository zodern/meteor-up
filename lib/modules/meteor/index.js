import path from 'path';
import debug from 'debug';
import nodemiral from 'nodemiral';
import uuid from 'uuid';
import {runTaskList} from '../utils';
import buildApp from './build.js';
import * as docker from '../docker/';
const log = debug('mup:module:meteor');


export function help(/* api */) {
  log('exec => mup meteor help');
}

export function logs(/* api */) {
  log('exec => mup meteor logs');
}

export function setup(api) {
  log('exec => mup meteor setup');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup Meteor');

  list.executeScript('setup environment', {
    script: path.resolve(__dirname, 'assets/meteor-setup.sh'),
    vars: {
      name: config.name,
    },
  });

  if (config.ssl) {
    list.copy('copying ssl certificate bundle', {
      src: config.ssl.crt,
      dest: '/opt/' + config.name + '/config/bundle.crt'
    });

    list.copy('copying ssl private key', {
      src: config.ssl.key,
      dest: '/opt/' + config.name + '/config/private.key'
    });

    list.executeScript('verifying ssl configurations', {
      script: path.resolve(__dirname, 'assets/verify-ssl-config.sh'),
      vars: {
        name: config.name
      },
    });
  }

  const sessions = api.getSessions([ 'meteor' ]);
  const apiForMeteor = api.withSessions([ 'meteor' ]);

  return docker.setup(apiForMeteor)
    .then(() => runTaskList(list, sessions));
}

export function push(api) {
  log('exec => mup meteor push');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  var buildLocation = path.resolve('/tmp', uuid.v4());
  var bundlePath = path.resolve(buildLocation, 'bundle.tar.gz');

  const promise = buildApp(config.path, buildLocation, config.buildOptions || {});
  promise.then(() => {
    const list = nodemiral.taskList('Pushing Meteor');

    list.execute('Creating app folder',{
      command: 'mkdir -p /opt/' + config.name + '/tmp'
    });

    list.copy('Pushing Meteor app bundle to the server', {
      src: bundlePath,
      dest: '/opt/' + config.name + '/tmp/bundle.tar.gz'
    });

    const sessions = api.getSessions([ 'meteor' ]);
    return runTaskList(list, sessions);
  });

  return promise;
}

export function start(api) {
  log('exec => mup meteor start');
  const list = nodemiral.taskList('Start Meteor');

  list.executeScript('start meteor', {
    script: path.resolve(__dirname, 'assets/meteor-start.sh')
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}

export function stop(api) {
  log('exec => mup meteor stop');
  const list = nodemiral.taskList('Stop Meteor');

  list.executeScript('stop meteor', {
    script: path.resolve(__dirname, 'assets/meteor-stop.sh')
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}
