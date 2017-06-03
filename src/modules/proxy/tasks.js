import * as _ from 'underscore';

import { getDockerLogs, resolvePath, runTaskList } from '../utils';

import debug from 'debug';
import nodemiral from 'nodemiral';

const log = debug('mup:module:proxy');

export const PROXY_CONTAINER_NAME = 'mup-nginx-proxy';

export function help(/* api */) {
  log('exec => mup proxy help');
  let commands = Object.keys(this).reduce((result, key) => {
    if (typeof this[key] !== 'function') {
      return result;
    }
    return result + (result.length === 0 ? '' : ', ') + key;
  }, '');

  console.log('mup proxy', `[${commands}]`);
}

export function logs(api) {
  log('exec => mup proxy logs');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs().slice(1);
  const sessions = api.getSessions(['meteor']);
  return getDockerLogs(PROXY_CONTAINER_NAME, sessions, args);
}

export function setup(api) {
  log('exec => mup proxy setup');
  const config = api.getConfig().proxy;
  const appName = api.getConfig().meteor.name;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  config.shared = config.shared || {};

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
      httpPort: config.shared.httpPort || 80,
      httpsPort: config.shared.httpsPort || 443,
      letsEncryptEmail: config.ssl ? config.ssl.letsEncryptEmail : null,
      clientUploadLimit: config.clientUploadLimit
    }
  });


  list.executeScript('Cleaning Up SSL Certificates', {
    script: resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
    vars: {
      name: appName,
      proxyName: PROXY_CONTAINER_NAME
    }
  });

  if (
    config.ssl &&
    !config.ssl.letsEncryptEmail &&
    config.ssl.upload !== false
  ) {
    list.copy('Copying SSL Certificate Bundle', {
      src: resolvePath(api.getBasePath(), config.ssl.crt),
      dest: `/opt/${appName}/config/bundle.crt`
    });
    list.copy('Copying SSL Private Key', {
      src: resolvePath(api.getBasePath(), config.ssl.key),
      dest: `/opt/${appName}/config/private.key`
    });
    list.executeScript('Setup SSL Certificates for Domains', {
      script: resolvePath(__dirname, 'assets/ssl-setup.sh'),
      vars: {
        appName,
        proxyName: PROXY_CONTAINER_NAME,
        domains: config.domains.split(',')
      }
    });
  }

  const sessions = api.getSessions(['meteor']);

  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  }).then(() => envconfig(api));
}

export function envconfig(api) {
  log('exec => mup proxy envconfig');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Configuring proxy Environment Variables');

  if (!config.shared) {
    config.shared = {};
  }
  var env = _.clone(config.shared.env);

  list.copy('Sending proxy Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env.list',
    vars: {
      env: env || {}
    }
  });
  var envLetsEncrypt = _.clone(config.shared.envLetsEncrypt);

  list.copy('Sending Letsencrypt Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env_letsencrypt.list',
    vars: {
      env: envLetsEncrypt || {}
    }
  });
  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  }).then(() => start(api));
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

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
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

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, { verbose: api.getVerbose() });
}
