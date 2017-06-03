import * as _ from 'underscore';

import { getDockerLogs, resolvePath, runTaskList } from '../utils';

import buildApp from './build.js';
import debug from 'debug';
import fs from 'fs';
import nodemiral from 'nodemiral';
import os from 'os';
import random from 'random-seed';
import uuid from 'uuid';
import { PROXY_CONTAINER_NAME } from '../proxy/index.js';

const log = debug('mup:module:meteor');

function tmpBuildPath(appPath) {
  let rand = random.create(appPath);
  let uuidNumbers = [];
  for (let i = 0; i < 16; i++) {
    uuidNumbers.push(rand(255));
  }
  return resolvePath(
    os.tmpdir(),
    `mup-meteor-${uuid.v4({ random: uuidNumbers })}`
  );
}

export function help() {
  log('exec => mup meteor help');
  console.log('mup meteor', Object.keys(this));
}

export function logs(api) {
  log('exec => mup meteor logs');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const args = api.getArgs();
  const sessions = api.getSessions(['meteor']);
  return getDockerLogs(config.name, sessions, args);
}

export function setup(api) {
  log('exec => mup meteor setup');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup Meteor');

  list.executeScript('Setup Environment', {
    script: resolvePath(__dirname, 'assets/meteor-setup.sh'),
    vars: {
      name: config.name
    }
  });

  if (config.ssl && typeof config.ssl.autogenerate !== 'object') {
    const basePath = api.getBasePath();

    if (config.ssl.upload !== false) {
      list.executeScript('Cleaning up SSL Certificates', {
        script: resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
        vars: {
          name: config.name
        }
      });
      list.copy('Copying SSL Certificate Bundle', {
        src: resolvePath(basePath, config.ssl.crt),
        dest: '/opt/' + config.name + '/config/bundle.crt'
      });

      list.copy('Copying SSL Private Key', {
        src: resolvePath(basePath, config.ssl.key),
        dest: '/opt/' + config.name + '/config/private.key'
      });
    }

    list.executeScript('Verifying SSL Configurations', {
      script: resolvePath(__dirname, 'assets/verify-ssl-config.sh'),
      vars: {
        name: config.name
      }
    });
  }

  const sessions = api.getSessions(['meteor']);

  return runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export async function push(api) {
  log('exec => mup meteor push');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const appPath = resolvePath(api.getBasePath(), config.path);

  let buildOptions = config.buildOptions || {};
  buildOptions.buildLocation = buildOptions.buildLocation ||
    tmpBuildPath(appPath);

  var bundlePath = resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');
  var rebuild = true;

  if (api.optionEnabled('cached-build')) {
    const buildCached = fs.existsSync(bundlePath);
    if (!buildCached) {
      console.log('Unable to use previous build. It doesn\'t exist.');
    } else {
      rebuild = false;
      console.log('Not rebuilding app. Using build from previous deploy at');
      console.log(`${buildOptions.buildLocation}`);
    }
  }

  if (rebuild) {
    console.log('Building App Bundle Locally');
    await buildApp(appPath, buildOptions, api.getVerbose());
  }

  const list = nodemiral.taskList('Pushing Meteor App');

  list.copy('Pushing Meteor App Bundle to The Server', {
    src: bundlePath,
    dest: '/opt/' + config.name + '/tmp/bundle.tar.gz',
    progressBar: config.enableUploadProgressBar
  });

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

export function envconfig(api) {
  log('exec => mup meteor envconfig');

  const config = api.getConfig().meteor;
  let bindAddress = '0.0.0.0';

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  config.log = config.log || {
    opts: {
      'max-size': '100m',
      'max-file': 10
    }
  };

  config.nginx = config.nginx || {};

  if (config.docker && config.docker.bind) {
    bindAddress = config.docker.bind;
  }

  if (!config.docker) {
    if (config.dockerImage) {
      config.docker = {
        image: config.dockerImage
      };
      delete config.dockerImage;
    } else {
      config.docker = {
        image: 'kadirahq/meteord'
      };
    }
  }

  if (config.dockerImageFrontendServer) {
    config.docker.imageFrontendServer = config.dockerImageFrontendServer;
  }
  if (!config.docker.imageFrontendServer) {
    config.docker.imageFrontendServer = 'meteorhacks/mup-frontend-server';
  }

  // If imagePort is not set, go with port 80 which was the traditional
  // port used by kadirahq/meteord and meteorhacks/meteord
  config.docker.imagePort = config.docker.imagePort || 80;

  if (config.ssl) {
    config.ssl.port = config.ssl.port || 443;
  }

  const list = nodemiral.taskList('Configuring App');
  list.copy('Pushing the Startup Script', {
    src: resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: '/opt/' + config.name + '/config/start.sh',
    vars: {
      appName: config.name,
      useLocalMongo: api.getConfig().mongo ? 1 : 0,
      port: config.env.PORT || 80,
      bind: bindAddress,
      sslConfig: config.ssl,
      logConfig: config.log,
      volumes: config.volumes,
      docker: config.docker,
      proxyConfig: api.getConfig().proxy,
      proxyName: PROXY_CONTAINER_NAME,
      nginxClientUploadLimit: config.nginx.clientUploadLimit || '10M'
    }
  });

  var env = _.clone(config.env);
  env.METEOR_SETTINGS = JSON.stringify(api.getSettings());
  // sending PORT to the docker container is useless.

  // setting PORT in the config is used for the publicly accessible
  // port.

  // docker.imagePort is used for the port exposed from the container.
  // In case the docker.imagePort is different than the container's
  // default port, we set the env PORT to docker.imagePort.
  env.PORT = config.docker.imagePort;

  list.copy('Sending Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env.list',
    vars: {
      env: env || {},
      appName: config.name
    }
  });

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

export function start(api) {
  log('exec => mup meteor start');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  let route = api.hasMeteorPackage('zodern:mup-helpers') ? '/___mup_verify' : '';

  const list = nodemiral.taskList('Start Meteor');

  list.executeScript('Start Meteor', {
    script: resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: config.name
    }
  });

  list.executeScript('Verifying Deployment', {
    script: resolvePath(__dirname, 'assets/meteor-deploy-check.sh'),
    vars: {
      deployCheckWaitTime: config.deployCheckWaitTime || 60,
      appName: config.name,
      deployCheckPort: config.deployCheckPort || config.env.PORT || 80,
      deployCheckPath: route,
      host: api.getConfig().proxy ? api.getConfig().proxy.domains.split(',')[0] : null
    }
  });

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

export function deploy(api) {
  log('exec => mup meteor deploy');

  // validate settings and config before starting
  api.getSettings();
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  return push(api).then(() => envconfig(api)).then(() => start(api));
}

export function stop(api) {
  log('exec => mup meteor stop');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Stop Meteor');

  list.executeScript('Stop Meteor', {
    script: resolvePath(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  const sessions = api.getSessions(['meteor']);
  return runTaskList(list, sessions, { verbose: api.getVerbose() });
}
