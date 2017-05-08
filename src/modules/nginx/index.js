/**
 * @author Shai Amir
 */

import * as _ from 'underscore';

import { getDockerLogs, resolvePath, runTaskList } from '../utils';

import debug from 'debug';
import nodemiral from 'nodemiral';

const log = debug('mup:module:nginx');

export function help(/* api */) {
  log('exec => mup nginx help');
  console.log('mup nginx', Object.keys(this));
}

export function logs(api) {
  log('exec => mup nginx logs');
  const config = api.getConfig().nginx;
  if (!config) {
    console.error('error: no configs found for nginx');
    process.exit(1);
  }

  const args = api.getArgs();
  const sessions = api.getSessions(['nginx']);
  return getDockerLogs(config.name, sessions, args);
}

export function setup(api) {
  log('exec => mup nginx setup');
  const config = api.getConfig().nginx;
  if (!config) {
    console.error('error: no configs found for nginx');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup nginx');

  list.executeScript('Setup Environment', {
    script: resolvePath(__dirname, 'assets/nginx-setup.sh'),
    vars: {
      name: config.name
    }
  });

  list.copy('Pushing the Startup Script', {
    src: resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: '/opt/' + config.name + '/config/start.sh',
    vars: {
      appName: config.name,
      httpPort: config.httpPort || 80,
      httpsPort: config.httpsPort,
      clientUploadLimit: config.clientUploadLimit
    }
  });

  const sessions = api.getSessions(['nginx']);

  return runTaskList(list, sessions, { series: true });
}

export function envconfig(api) {
  log('exec => mup nginx envconfig');
  const config = api.getConfig().nginx;
  if (!config) {
    console.error('error: no configs found for nginx');
    process.exit(1);
  }

  const list = nodemiral.taskList('Configuring nginx Environment Variables');

  var env = _.clone(config.env);

  list.copy('Sending nginx Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env.list',
    vars: {
      env: env || {}
    }
  });
  var envLetsencrypt = _.clone(config.envLetsencrypt);

  list.copy('Sending Letsencrypt Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env_letsencrypt.list',
    vars: {
      env: envLetsencrypt || {}
    }
  });
  const sessions = api.getSessions(['nginx']);
  return runTaskList(list, sessions, { series: true });
}

export function start(api) {
  log('exec => mup nginx start');
  const config = api.getConfig().nginx;
  if (!config) {
    console.error('error: no configs found for nginx');
    process.exit(1);
  }

  if (typeof config.name !== 'string' || config.name.length < 1) {
    console.error('error: nginx.name needs to be a string');
    process.exit(1);
  }

  const list = nodemiral.taskList('Start nginx');

  list.executeScript('Start nginx', {
    script: resolvePath(__dirname, 'assets/nginx-start.sh'),
    vars: {
      appName: config.name
    }
  });

  const sessions = api.getSessions(['nginx']);
  return runTaskList(list, sessions, { series: true });
}

export function stop(api) {
  log('exec => mup nginx stop');
  const config = api.getConfig().nginx;
  if (!config) {
    console.error('error: no configs found for nginx');
    process.exit(1);
  }

  const list = nodemiral.taskList('Stop nginx');

  list.executeScript('Stop nginx', {
    script: resolvePath(__dirname, 'assets/nginx-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  const sessions = api.getSessions(['nginx']);
  return runTaskList(list, sessions);
}
