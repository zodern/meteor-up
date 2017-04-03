import * as _ from 'underscore';

import { getDockerLogs, resolvePath, runTaskList } from '../utils';
import { getConfig, getSessions, getSettings, getArgs, getBasePath } from '../../mup-api';
import { argv } from 'yargs';

import buildApp from './build.js';
import debug from 'debug';
import fs from 'fs';
import nodemiral from 'nodemiral';
import random from 'random-seed';
import uuid from 'uuid';
import os from 'os';

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

export function logs() {
  log('exec => mup meteor logs');
  const config = getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const args = getArgs();
  const sessions = getSessions(['meteor']);
  return getDockerLogs(config.name, sessions, args);
}

export function setup() {
  log('exec => mup meteor setup');
  const config = getConfig().meteor;
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
    const basePath = getBasePath();

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

  const sessions = getSessions(['meteor']);

  return runTaskList(list, sessions, { verbose: argv.verbose });
}

export async function push() {
  log('exec => mup meteor push');
  const config = getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const appPath = resolvePath(getBasePath(), config.path);

  let buildOptions = config.buildOptions || {};
  buildOptions.buildLocation = buildOptions.buildLocation ||
    tmpBuildPath(appPath);

  var bundlePath = resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');
  if (!argv['cached-build']) {
    // Check if using force-ssl package and ssl is not setup.
    // This is a common problem people encounter when deploying
    try {
      var contents = fs
        .readFileSync(resolvePath(appPath, '.meteor/versions'))
        .toString();
      // Looks for "force-ssl@" in the begining of a
      // line or at the start of the file
      var match = /(^|\s)force-ssl@/m;
      if (match.test(contents)) {
        console.log(
          'Your app is using the "force-ssl" package, but ssl is not setup in your mup config.'
        );
        console.log('This can cause unexpected redirects.');
      }
    } catch (e) {
      // This is optional functionality and if it fails
      // it shouldn't prevent building.
    }

    console.log('Building App Bundle Locally');
    await buildApp(appPath, buildOptions, argv.verbose);
  } else {
    const buildCached = fs.existsSync(bundlePath);
    if (!buildCached) {
      console.log('Unable to use previous build. It doesn\'t exist.');
      console.log('Remove the "--cached-build" option and try again.');
      process.exit(1);
    }
    console.log('Skipping build. Using previous build at');
    console.log(`${buildOptions.buildLocation}`);
  }

  const list = nodemiral.taskList('Pushing Meteor App');

  list.copy('Pushing Meteor App Bundle to The Server', {
    src: bundlePath,
    dest: '/opt/' + config.name + '/tmp/bundle.tar.gz',
    progressBar: config.enableUploadProgressBar
  });

  const sessions = getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: argv.verbose
  });
}

export function envconfig() {
  log('exec => mup meteor envconfig');

  const config = getConfig().meteor;
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
      useLocalMongo: getConfig().mongo ? 1 : 0,
      port: config.env.PORT || 80,
      bind: bindAddress,
      sslConfig: config.ssl,
      logConfig: config.log,
      volumes: config.volumes,
      docker: config.docker,
      nginxClientUploadLimit: config.nginx.clientUploadLimit || '10M'
    }
  });

  var env = _.clone(config.env);
  env.METEOR_SETTINGS = JSON.stringify(getSettings());
  // sending PORT to the docker container is useless.
  // It'll run on PORT 80 and we can't override it
  // Changing the port is done via the start.sh script
  delete env.PORT;

  list.copy('Sending Environment Variables', {
    src: resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env.list',
    vars: {
      env: env || {},
      appName: config.name
    }
  });

  const sessions = getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: argv.verbose
  });
}

export function start() {
  log('exec => mup meteor start');
  const config = getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

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
      deployCheckPort: config.deployCheckPort || config.env.PORT || 80
    }
  });

  const sessions = getSessions(['meteor']);
  return runTaskList(list, sessions, {
    series: true,
    verbose: argv.verbose
  });
}

export function deploy() {
  log('exec => mup meteor deploy');

  // validate settings and config before starting
  getSettings();
  const config = getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  return push().then(() => envconfig()).then(() => start());
}

export function stop() {
  log('exec => mup meteor stop');
  const config = getConfig().meteor;
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

  const sessions = getSessions(['meteor']);
  return runTaskList(list, sessions, { verbose: argv.verbose });
}
