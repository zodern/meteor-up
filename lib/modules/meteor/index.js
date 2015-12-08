import path from 'path';
import nodemiral from 'nodemiral';
import {runTaskList} from '../utils';
import * as docker from '../docker/';

// export function dump(api) {
//
// }

export function help(/* api */) {
  console.log('TODO: mup meteor help');
}

// export function logs(api) {
//
// }

export function setup(api) {
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
    taskList.copy('copying ssl certificate bundle', {
      src: config.ssl.crt,
      dest: '/opt/' + config.name + '/config/bundle.crt'
    });

    taskList.copy('copying ssl private key', {
      src: config.ssl.key,
      dest: '/opt/' + config.name + '/config/private.key'
    });

    taskList.executeScript('verifying ssl configurations', {
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

export function start(api) {
  const list = nodemiral.taskList('Start Meteor');

  list.executeScript('start meteor', {
    script: path.resolve(__dirname, 'assets/meteor-start.sh')
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}

export function stop(api) {
  const list = nodemiral.taskList('Stop Meteor');

  list.executeScript('stop meteor', {
    script: path.resolve(__dirname, 'assets/meteor-stop.sh')
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}
