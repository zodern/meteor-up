import {
  addStartAppTask,
  checkAppStarted,
  createEnv,
  createServiceConfig,
  currentImageTag,
  getBuildOptions,
  getNodeVersion,
  getSessions,
  prepareBundleSupported,
  shouldRebuild
} from './utils';
import buildApp, { archiveApp } from './build.js';
import { checkUrls, createPortInfoLines, displayAvailability, getInformation, withColor } from './status';
import { map, promisify } from 'bluebird';
import debug from 'debug';
import nodemiral from '@zodern/nodemiral';


const log = debug('mup:module:meteor');

export async function logs(api) {
  log('exec => mup meteor logs');
  const {
    app
  } = api.getConfig();
  const swarmEnabled = api.swarmEnabled();

  if (!app) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const args = api.getArgs();

  if (args[0] === 'meteor') {
    args.shift();
  }
  if (swarmEnabled) {
    args.unshift('service');
  }

  const sessions = await getSessions(api);

  return api.getDockerLogs(app.name, sessions, args, !swarmEnabled);
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
    let tag = 'latest';

    if (api.swarmEnabled()) {
      const data = await api.getServerInfo();
      tag = currentImageTag(data, config.name) + 1;
    }

    list.executeScript('Prepare Bundle', {
      script: api.resolvePath(
        __dirname,
        'assets/prepare-bundle.sh'
      ),
      vars: {
        appName: config.name,
        dockerImage: config.docker.image,
        env: config.env,
        buildInstructions: config.docker.buildInstructions || [],
        nodeVersion: getNodeVersion(api, buildOptions.buildLocation),
        stopApp: config.docker.stopAppDuringPrepareBundle,
        tag
      }
    });

    // After running Prepare Bundle, the list of images is out of date
    api.serverInfoStale();
  }

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export function envconfig(api) {
  log('exec => mup meteor envconfig');
  const {
    servers,
    app,
    proxy
  } = api.getConfig();

  if (api.swarmEnabled()) {
    // The `start` command handles updating the environment
    // when swarm is enabled
    return;
  }

  let bindAddress = '0.0.0.0';

  if (!app) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  app.log = app.log || {
    opts: {
      'max-size': '100m',
      'max-file': 10
    }
  };

  app.nginx = app.nginx || {};

  if (app.docker && app.docker.bind) {
    bindAddress = app.docker.bind;
  }

  if (app.dockerImageFrontendServer) {
    app.docker.imageFrontendServer = app.dockerImageFrontendServer;
  }
  if (!app.docker.imageFrontendServer) {
    app.docker.imageFrontendServer = 'meteorhacks/mup-frontend-server';
  }

  if (app.ssl) {
    app.ssl.port = app.ssl.port || 443;
  }

  const startHostVars = {};

  Object.keys(app.servers).forEach(serverName => {
    const host = servers[serverName].host;
    if (app.servers[serverName].bind) {
      startHostVars[host] = { bind: app.servers[serverName].bind };
    }
  });

  const list = nodemiral.taskList('Configuring App');

  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: `/opt/${app.name}/config/start.sh`,
    hostVars: startHostVars,
    vars: {
      appName: app.name,
      port: app.env.PORT || 80,
      bind: bindAddress,
      sslConfig: app.ssl,
      logConfig: app.log,
      volumes: app.volumes,
      docker: app.docker,
      proxyConfig: proxy,
      nginxClientUploadLimit: app.nginx.clientUploadLimit || '10M'
    }
  });

  const env = createEnv(app, api.getSettings());
  const hostVars = {};

  Object.keys(app.servers).forEach(key => {
    const host = servers[key].host;
    if (app.servers[key].env) {
      hostVars[host] = { env: app.servers[key].env };
    }
    if (app.servers[key].settings) {
      const settings = JSON.stringify(api.getSettingsFromPath(
        app.servers[key].settings));

      if (hostVars[host]) {
        hostVars[host].env.METEOR_SETTINGS = settings;
      } else {
        hostVars[host] = { env: { METEOR_SETTINGS: settings } };
      }
    }
  });

  list.copy('Sending Environment Variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${app.name}/config/env.list`,
    hostVars,
    vars: {
      env: env || {},
      appName: app.name
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
  const swarmEnabled = api.swarmEnabled();

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Start Meteor');

  if (swarmEnabled) {
    const currentService = await api.dockerServiceInfo(config.name);
    const serverInfo = await api.getServerInfo();
    const imageTag = currentImageTag(serverInfo, config.name);

    // TODO: make it work when the reverse proxy isn't enabled
    api.tasks.addCreateOrUpdateService(
      list,
      createServiceConfig(api, imageTag),
      currentService
    );
  } else {
    addStartAppTask(list, api);
    checkAppStarted(list, api);
  }

  const sessions = await getSessions(api);

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

export async function stop(api) {
  log('exec => mup meteor stop');
  const config = api.getConfig().app;
  const swarmEnabled = api.swarmEnabled();

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

  const sessions = await getSessions(api);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

export async function restart(api) {
  const list = nodemiral.taskList('Restart Meteor');
  const {
    app: appConfig
  } = api.getConfig();
  const sessions = await getSessions(api);

  if (api.swarmEnabled()) {
    api.tasks.addRestartService(list, { name: appConfig.name });
  } else {
    list.executeScript('Stop Meteor', {
      script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
      vars: {
        appName: appConfig.name
      }
    });
    addStartAppTask(list, api);
    checkAppStarted(list, api);
  }


  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export async function status(api) {
  const config = api.getConfig();
  const {
    StatusDisplay
  } = api.statusHelpers;
  const overview = api.getOptions().overview;
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

  const display = new StatusDisplay(`Meteor Status - ${config.app.name}`);

  results.forEach((result, index) => {
    const urlResult = urlResults[index] || {};
    const section = display.addLine(`- ${result.host}: ${withColor(result.statusColor, result.status)}`, result.statusColor);

    section.addLine(`Created at ${result.created}`);
    section.addLine(`Restarted ${result.restartCount} times`, result.restartColor);

    if (result.env) {
      const envSection = section.addLine('ENV:');
      result.env.forEach(envVar => {
        envSection.addLine(`- ${envVar}`);
      });
    }

    createPortInfoLines(result.exposedPorts, result.publishedPorts, section);
    displayAvailability(result, urlResult, section);
  });

  display.show(overview);
}
