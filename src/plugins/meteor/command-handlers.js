import { addStartAppTask, checkAppStarted, createEnv, prepareBundleSupported } from './utils';
import buildApp, { archiveApp } from './build.js';
import { checkUrls, getInformation } from './status';
import { map, promisify } from 'bluebird';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs';
import nodemiral from 'nodemiral';
import os from 'os';
import random from 'random-seed';
import uuid from 'uuid';

const log = debug('mup:module:meteor');

function tmpBuildPath(appPath, api) {
  const rand = random.create(appPath);
  const uuidNumbers = [];

  for (let i = 0; i < 16; i++) {
    uuidNumbers.push(rand(255));
  }

  return api.resolvePath(
    os.tmpdir(),
    `mup-meteor-${uuid.v4({ random: uuidNumbers })}`
  );
}

export function logs(api) {
  log('exec => mup meteor logs');
  const config = api.getConfig().app;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const args = api.getArgs();

  if (args[0] === 'meteor') {
    args.shift();
  }

  const sessions = api.getSessions(['app']);

  return api.getDockerLogs(config.name, sessions, args);
}

export function setup(api) {
  log('exec => mup meteor setup');
  const config = api.getConfig().app;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup Meteor');

  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/meteor-setup.sh'),
    vars: {
      name: config.name
    }
  });

  if (config.ssl && typeof config.ssl.autogenerate !== 'object') {
    const basePath = api.getBasePath();

    if (config.ssl.upload !== false) {
      list.executeScript('Cleaning up SSL Certificates', {
        script: api.resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
        vars: {
          name: config.name
        }
      });
      list.copy('Copying SSL Certificate Bundle', {
        src: api.resolvePath(basePath, config.ssl.crt),
        dest: `/opt/${config.name}/config/bundle.crt`
      });

      list.copy('Copying SSL Private Key', {
        src: api.resolvePath(basePath, config.ssl.key),
        dest: `/opt/${config.name}/config/private.key`
      });
    }

    list.executeScript('Verifying SSL Configurations', {
      script: api.resolvePath(__dirname, 'assets/verify-ssl-config.sh'),
      vars: {
        name: config.name
      }
    });
  }

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function getBuildOptions(api) {
  const config = api.getConfig().app;
  const appPath = api.resolvePath(api.getBasePath(), config.path);

  const buildOptions = config.buildOptions || {};

  buildOptions.buildLocation =
    buildOptions.buildLocation || tmpBuildPath(appPath, api);

  return buildOptions;
}

function shouldRebuild(api) {
  let rebuild = true;
  const { buildLocation } = getBuildOptions(api);
  const bundlePath = api.resolvePath(buildLocation, 'bundle.tar.gz');

  if (api.getOptions()['cached-build']) {
    const buildCached = fs.existsSync(bundlePath);

    // If build is not cached, rebuild is true
    // even though the --cached-build flag was used
    if (buildCached) {
      rebuild = false;
    }
  }

  return rebuild;
}

export async function build(api) {
  const config = api.getConfig().app;
  const appPath = api.resolvePath(api.getBasePath(), config.path);
  const buildOptions = getBuildOptions(api);

  const rebuild = shouldRebuild(api);

  if (rebuild && api.getOptions()['cached-build']) {
    console.log('Unable to use previous build. It doesn\'t exist.');
  } else if (!rebuild) {
    console.log('Not building app. Using build from previous deploy at');
    console.log(buildOptions.buildLocation);
  }

  if (rebuild) {
    console.log('Building App Bundle Locally');
    await buildApp(appPath, buildOptions, api.getVerbose(), api);
  }
}

export async function push(api) {
  log('exec => mup meteor push');

  await api.runCommand('meteor.build');

  const config = api.getConfig().app;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const buildOptions = getBuildOptions(api);

  const bundlePath = api.resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');

  if (shouldRebuild(api)) {
    await promisify(archiveApp)(buildOptions.buildLocation, api);
  }

  const list = nodemiral.taskList('Pushing Meteor App');

  list.copy('Pushing Meteor App Bundle to the Server', {
    src: bundlePath,
    dest: `/opt/${config.name}/tmp/bundle.tar.gz`,
    progressBar: config.enableUploadProgressBar
  });

  if (prepareBundleSupported(config.docker)) {
    list.executeScript('Prepare Bundle', {
      script: api.resolvePath(
        __dirname,
        'assets/prepare-bundle.sh'
      ),
      vars: {
        appName: config.name,
        dockerImage: config.docker.image,
        env: config.env,
        buildInstructions: config.docker.buildInstructions || []
      }
    });
  }

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export function envconfig(api) {
  log('exec => mup meteor envconfig');

  const config = api.getConfig().app;
  const servers = api.getConfig().servers;
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
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: `/opt/${config.name}/config/start.sh`,
    vars: {
      appName: config.name,
      port: config.env.PORT || 80,
      bind: bindAddress,
      sslConfig: config.ssl,
      logConfig: config.log,
      volumes: config.volumes,
      docker: config.docker,
      proxyConfig: api.getConfig().proxy,
      nginxClientUploadLimit: config.nginx.clientUploadLimit || '10M'
    }
  });

  const env = createEnv(config, api.getSettings());
  const hostVars = {};

  Object.keys(config.servers).forEach(key => {
    if (config.servers[key].env) {
      hostVars[servers[key].host] = { env: config.servers[key].env };
    }
    if (config.servers[key].settings) {
      const settings = JSON.stringify(api.getSettingsFromPath(
        config.servers[key].settings));

      if (hostVars[servers[key].host]) {
        hostVars[servers[key].host].env.METEOR_SETTINGS = settings;
      } else {
        hostVars[servers[key].host] = { env: { METEOR_SETTINGS: settings } };
      }
    }
  });

  list.copy('Sending Environment Variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${config.name}/config/env.list`,
    hostVars,
    vars: {
      env: env || {},
      appName: config.name
    }
  });

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export async function start(api) {
  log('exec => mup meteor start');
  const config = api.getConfig().app;
  const service = api.getConfig().swarm !== undefined;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Start Meteor');

  if (service) {
    const currentService = await api.dockerServiceInfo(config.name);

    // TODO: make it work when the reverse proxy isn't enabled
    api.tasks.addCreateOrUpdateService(list, {
      image: `mup-${config.name.toLowerCase()}:previous`,
      name: config.name,
      mode: 'global',
      env: createEnv(config, api.getSettings()),
      endpointMode: 'dnsrr',
      networks: ['mup-proxy'],
      hostname: `{{.Node.Hostname}}-${config.name}-{{.Task.ID}}`
    }, currentService);
  } else {
    addStartAppTask(list, api);
    checkAppStarted(list, api);
  }

  const sessions = service ? [await api.getManagerSession()] : api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export function deploy(api) {
  log('exec => mup meteor deploy');

  // validate settings and config before starting
  api.getSettings();
  const config = api.getConfig().app;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  return api
    .runCommand('meteor.push')
    .then(() => api.runCommand('default.reconfig'));
}

export function stop(api) {
  log('exec => mup meteor stop');
  const config = api.getConfig().app;
  const swarmEnabled = api.getConfig().swarm !== undefined;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Stop Meteor');

  if (swarmEnabled) {
    api.tasks.addStopService(list, {
      name: config.name
    });
  } else {
    list.executeScript('Stop Meteor', {
      script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
      vars: {
        appName: config.name
      }
    });
  }

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

export function restart(api) {
  const list = nodemiral.taskList('Restart Meteor');
  const sessions = api.getSessions(['app']);
  const config = api.getConfig().app;

  list.executeScript('Stop Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  addStartAppTask(list, api);
  checkAppStarted(list, api);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export async function status(api) {
  const config = api.getConfig();
  const lines = [];
  const servers = Object.keys(config.app.servers)
    .map(key => config.servers[key]);

  const results = await map(
    servers,
    server => getInformation(server, config.app.name, api),
    { concurrency: 2 }
  );
  const urlResults = await map(
    servers,
    server => checkUrls(server, config.app, api),
    { concurrency: 2 }
  );

  let overallColor = 'green';

  function updateColor(color) {
    if (color === 'yellow' && overallColor !== 'red') {
      overallColor = color;
    } else if (color === 'red') {
      overallColor = color;
    }
  }

  results.forEach((result, index) => {
    updateColor(result.statusColor);
    updateColor(result.restartColor);

    lines.push(` - ${result.host}: ${chalk[result.statusColor](result.status)} `);

    if (result.status === 'Stopped') {
      return;
    }

    lines.push(`    Created at ${result.created}`);
    lines.push(chalk[result.restartColor](`    Restarted ${result.restartCount} times`));

    lines.push('    ENV: ');
    result.env.forEach(envVar => {
      lines.push(`     - ${envVar}`);
    });

    if (result.exposedPorts.length > 0) {
      lines.push('    Exposed Ports:');
      result.exposedPorts.forEach(port => {
        lines.push(`     - ${port}`);
      });
    }

    if (result.publishedPorts.length > 0) {
      lines.push('    Published Ports:');
      result.publishedPorts.forEach(port => {
        lines.push(`     - ${port}`);
      });
    }

    const urlResult = urlResults[index];

    if (result.publishedPorts.length > 0) {
      lines.push(`    App running at http://${result.host}:${result.publishedPorts[0].split('/')[0]}`);
      lines.push(`     - Available in app's docker container: ${urlResult.inDocker}`);
      lines.push(`     - Available on server: ${urlResult.remote}`);
      lines.push(`     - Available on local computer: ${urlResult.local}`);
    } else {
      lines.push('    App available through reverse proxy');
      lines.push(`     - Available in app's docker container: ${urlResult.inDocker}`);
    }
  });

  console.log(chalk[overallColor]('\n=> Meteor Status'));
  console.log(lines.join('\n'));
}
