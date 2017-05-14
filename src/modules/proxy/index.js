import * as _ from 'underscore';

import { getDockerLogs, resolvePath, runTaskList } from '../utils';

import debug from 'debug';
import nodemiral from 'nodemiral';

const log = debug('mup:module:proxy');

const PROXY_CONTAINER_NAME = 'mup-reverse-proxy';

export function help(/* api */) {
  log('exec => mup proxy help');
  console.log('mup proxy', Object.keys(this));
}

export function logs(api) {
  log('exec => mup proxy logs');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs();
  const sessions = api.getSessions(['proxy']);
  return getDockerLogs(PROXY_CONTAINER_NAME, sessions, args);
}

export function setup(api) {
  log('exec => mup proxy setup');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup proxy');

  list.executeScript('Setup Environment', {
    script: resolvePath(__dirname, 'assets/proxy-setup.sh'),
    vars: {
      name: PROXY_CONTAINER_NAME
    }
  });

  list.copy('Pushing the Startup Script', {
    src: resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/start.sh',
    vars: {
      appName: PROXY_CONTAINER_NAME,
      httpPort: config.httpPort || 80,
      httpsPort: config.httpsPort,
      clientUploadLimit: config.clientUploadLimit
    }
  });

  const sessions = api.getSessions(['proxy']);

  return runTaskList(list, sessions, { series: true }).then(() => envconfig(api));
}

export function envconfig(api) {
  log('exec => mup proxy envconfig');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Configuring proxy Environment Variables');

  var env = _.clone(config.env);

  list.copy('Sending proxy Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env.list',
    vars: {
      env: env || {}
    }
  });
  var envLetsencrypt = _.clone(config.envLetsencrypt);

  list.copy('Sending Letsencrypt Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env_letsencrypt.list',
    vars: {
      env: envLetsencrypt || {}
    }
  });
  const sessions = api.getSessions(['proxy']);
  return runTaskList(list, sessions, { series: true }).then(() => start(api));
}

export function start(api) {
  log('exec => mup proxy start');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  // if (typeof config.name !== 'string' || config.name.length < 1) {
  //   console.error('error: proxy.name needs to be a string');
  //   process.exit(1);
  // }

  const list = nodemiral.taskList('Start proxy');

  list.executeScript('Start proxy', {
    script: resolvePath(__dirname, 'assets/proxy-start.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  const sessions = api.getSessions(['proxy']);
  return runTaskList(list, sessions, { series: true });
}

export function stop(api) {
  log('exec => mup proxy stop');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Stop proxy');

  list.executeScript('Stop proxy', {
    script: resolvePath(__dirname, 'assets/proxy-stop.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  const sessions = api.getSessions(['proxy']);
  return runTaskList(list, sessions);
}
