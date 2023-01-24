import {
  addStartAppTask,
  checkAppStarted,
  createEnv,
  createServiceConfig,
  escapeEnvQuotes,
  getImagePrefix,
  getNodeVersion,
  getSessions,
  getVersions,
  shouldRebuild
} from './utils';
import buildApp, { archiveApp, cleanBuildDir } from './build.js';
import { checkUrls, createPortInfoLines, displayAvailability, getInformation, withColor } from './status';
import { map, promisify } from 'bluebird';
import { prepareBundleLocally, prepareBundleSupported } from './prepare-bundle';
import debug from 'debug';
import nodemiral from '@zodern/nodemiral';
import { rollback } from './rollback';
import state from './state';
import { Client } from 'ssh2-classic';


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
  const buildOptions = config.buildOptions;

  const rebuild = shouldRebuild(api);

  if (rebuild && api.getOptions()['cached-build']) {
    console.log('Unable to use previous build. It doesn\'t exist.');
  } else if (!rebuild) {
    console.log('Not building app. Using build from previous deploy at');
    console.log(buildOptions.buildLocation);
  }

  if (rebuild) {
    if (buildOptions.cleanBuildLocation === true) {
      console.log('Cleaning Up Previous Builds');
      await cleanBuildDir(buildOptions.buildLocation);
    }
    console.log('Building App Bundle Locally');
    await buildApp(appPath, buildOptions, api.getVerbose(), api);
  }
}

export async function prepareBundle(api) {
  log('exec => mup meteor prepare-bundle');
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();

  if (!appConfig) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  if (!prepareBundleSupported(appConfig.docker)) {
    return;
  }

  const buildOptions = appConfig.buildOptions;
  const bundlePath = api.resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');

  // await getVersions(api);

  const sessions = api.getSessions(['app']);

  const { latest, servers: serverVersions } = await getVersions(api);
  const tag = latest + 1;
  state.deployingVersion = tag;

  if (appConfig.docker.prepareBundleLocally) {
    await prepareBundleLocally(buildOptions.buildLocation, bundlePath, api);
  } else {
    const list = nodemiral.taskList('Prepare App Bundle');
    const nodeVersion = await getNodeVersion(bundlePath);

    list.executeScript('Prepare Bundle', {
      script: api.resolvePath(
        __dirname,
        'assets/prepare-bundle.sh'
      ),
      vars: {
        appName: appConfig.name,
        dockerImage: appConfig.docker.image,
        env: escapeEnvQuotes(appConfig.env),
        buildInstructions: appConfig.docker.buildInstructions || [],
        nodeVersion,
        stopApp: appConfig.docker.stopAppDuringPrepareBundle,
        useBuildKit: appConfig.docker.useBuildKit,
        tag,
        privateRegistry: privateDockerRegistry,
        imagePrefix: getImagePrefix(privateDockerRegistry)
      }
    });

    // After running Prepare Bundle, the list of images will be out of date
    api.serverInfoStale();

    let prepareSessions = sessions;
    if (privateDockerRegistry) {
      prepareSessions = [sessions[0]].filter(s => s);
    }

    await api.runTaskList(list, prepareSessions, {
      series: true,
      verbose: api.verbose
    });
  }

  const toClean = Object.create(null);

  serverVersions.forEach(({ host, versions, current, previous }) => {
    let toKeep = [current, previous, tag];
    toClean[host] = {
      versions: versions.filter(version => !toKeep.includes(version))
    };
  });


  const list = nodemiral.taskList('Clean Up Versions');

  list.executeScript('Clean up app versions', {
    script: api.resolvePath(__dirname, 'assets/clean-versions.sh'),
    vars: {
      // TODO: add a default version-history from other servers
      // on servers that don't have a history so it has something to
      // rollback to if the current deploy fails
      appName: appConfig.name,
      imagePrefix: getImagePrefix(privateDockerRegistry)
    },
    hostVars: toClean
  });

  await api.runTaskList(list, sessions, {
    series: false
  });
}

export async function push(api) {
  log('exec => mup meteor push');

  await api.runCommand('meteor.build');
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();

  if (!appConfig) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const buildOptions = appConfig.buildOptions;

  const bundlePath = api.resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');

  if (shouldRebuild(api)) {
    await promisify(archiveApp)(buildOptions.buildLocation, api);
  }

  if (appConfig.docker.prepareBundleLocally) {
    return api.runCommand('meteor.prepareBundle');
  }

  const list = nodemiral.taskList('Pushing Meteor App');

  list.copy('Pushing Meteor App Bundle to the Server', {
    src: bundlePath,
    dest: `/opt/${appConfig.name}/tmp/bundle.tar.gz`,
    progressBar: true
  });

  let sessions = api.getSessions(['app']);

  // If we are using a private registry,
  // we only need to build it once. All of the other servers
  // can pull the image from the registry instead of rebuilding it
  if (privateDockerRegistry) {
    sessions = sessions.slice(0, 1);
  }

  await api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });

  return api.runCommand('meteor.prepareBundle');
}

export function envconfig(api) {
  log('exec => mup meteor envconfig');
  const {
    app,
    proxy,
    privateDockerRegistry
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
  const expandedServers = api.expandServers(app.servers);

  Object.values(expandedServers).forEach(({ server, config }) => {
    const host = server.host;
    const vars = {};
    if (config.bind) {
      vars.bind = config.bind;
    }
    if (config.env && config.env.PORT) {
      vars.port = config.env.PORT;
    }
    startHostVars[host] = vars;
  });

  const list = nodemiral.taskList('Configuring App');

  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: `/opt/${app.name}/config/start.sh`,
    hostVars: startHostVars,
    vars: {
      imagePrefix: getImagePrefix(privateDockerRegistry),
      appName: app.name,
      port: app.env.PORT || 80,
      bind: bindAddress,
      sslConfig: app.ssl,
      logConfig: app.log,
      volumes: app.volumes,
      docker: app.docker,
      proxyConfig: proxy,
      nginxClientUploadLimit: app.nginx.clientUploadLimit || '10M',
      privateRegistry: privateDockerRegistry
    }
  });

  const env = createEnv(app, api.getSettings());
  const hostVars = {};

  Object.values(expandedServers).forEach(({ server, config }) => {
    const host = server.host;
    if (config.env) {
      hostVars[host] = {
        env: {
          ...config.env,
          // We treat the PORT specially and do not pass it to the container
          PORT: undefined
        }
      };
    }
    if (config.settings) {
      const settings = JSON.stringify(api.getSettingsFromPath(
        config.settings));

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
  const { app: config } = api.getConfig();
  const swarmEnabled = api.swarmEnabled();

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const isDeploy = api.commandHistory.find(entry =>
    ['meteor.deploy', 'meteor.deployVersion'].includes(entry.name)
  );
  const list = nodemiral.taskList('Start Meteor');

  if (swarmEnabled) {
    const currentService = await api.dockerServiceInfo(config.name);
    const { latest: imageTag } = await getVersions(api);

    // TODO: make it work when the reverse proxy isn't enabled
    api.tasks.addCreateOrUpdateService(
      list,
      createServiceConfig(api, imageTag),
      currentService
    );
  } else {
    addStartAppTask(list, api, { isDeploy, version: state.deployingVersion });
    checkAppStarted(list, api, {
      canRollback: isDeploy,
      recordFailed: isDeploy && !api.commandHistory.find(
        entry => entry.name === 'meteor.deployVersion'
      )
    });
  }

  const sessions = await getSessions(api);

  try {
    await api.runTaskList(list, sessions, {
      series: true,
      verbose: api.verbose
    });

    if (isDeploy) {
      console.log(`Successfully deployed version ${state.deployingVersion}`);
    }
  } catch (e) {
    if (
      isDeploy &&
      prepareBundleSupported(config.docker) &&
      !api.swarmEnabled()
    ) {
      console.log('Deploy failed. Check the logs above for the reason');
      console.log('=> Ensuring all servers have same version');
      await rollback(api);
    }

    throw e;
  }
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

export async function deployVersion(api) {
  log('exec => mup meteor deploy');

  // validate settings and config before starting
  api.getSettings();
  const config = api.getConfig().app;

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  let version = api.getArgs()[2];

  if (!version) {
    console.error('Please provide a version');
    process.exit(1);
  }

  version = parseInt(version, 10);

  if (Number.isNaN(version)) {
    console.log('Version is not a valid number');
    process.exit(1);
  }

  state.deployingVersion = version;

  return api.runCommand('default.reconfig');
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
    list._runHook('Stopping app', {
      hookName: 'app.shutdown'
    });
    list.executeScript('Stop Meteor', {
      script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
      vars: {
        appName: appConfig.name
      }
    });
    addStartAppTask(list, api);
    checkAppStarted(list, api);
    list._runHook('Finish starting', {
      hookName: 'app.start-instance'
    });
  }


  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

export async function debugApp(api) {
  const {
    app
  } = api.getConfig();
  let serverOption = api.getArgs()[2];
  let expandedServers = api.expandServers(app.servers);

  // Check how many sessions are enabled. Usually is all servers,
  // but can be reduced by the `--servers` option
  const enabledSessions = api.getSessions(['app'])
    .filter(session => session);

  if (!(serverOption in expandedServers)) {
    if (enabledSessions.length === 1) {
      const selectedHost = enabledSessions[0]._host;
      serverOption = Object.keys(expandedServers).find(
        name => expandedServers[name].server.host === selectedHost
      );
    } else {
      console.log('mup meteor debug <server>');
      console.log('Available servers are:\n', Object.keys(app.servers).join('\n '));
      process.exitCode = 1;

      return;
    }
  }

  const server = expandedServers[serverOption].server;
  console.log(`Setting up to debug app running on ${serverOption}`);

  const {
    output
  } = await api.runSSHCommand(server, `docker exec -t ${app.name} sh -c 'kill -s USR1 $(pidof -s node)'`);

  // normally is blank, but if something went wrong
  // it will have the error message
  console.log(output);

  const {
    output: startOutput
  } = await api.runSSHCommand(server, `sudo docker rm -f meteor-debug; sudo docker run -d --name meteor-debug --network=container:${app.name} alpine/socat TCP-LISTEN:9228,fork TCP:127.0.0.1:9229`);
  if (api.getVerbose()) {
    console.log('output from starting meteor-debug', startOutput);
  }

  const {
    output: ipAddress
  } = await api.runSSHCommand(server, `sudo docker inspect --format="{{ range .NetworkSettings.Networks }} {{.IPAddress }} {{ end }}" ${app.name} | head -n 1`);

  if (api.getVerbose()) {
    console.log('container address', ipAddress);
  }

  const {
    output: startOutput2
  } = await api.runSSHCommand(server, `sudo docker rm -f meteor-debug-2; sudo docker run -d --name meteor-debug-2 -p 9227:9227 alpine/socat TCP-LISTEN:9227,fork TCP:${ipAddress.trim()}:9228`);

  if (api.getVerbose()) {
    console.log('output from starting meteor-debug-2', startOutput2);
  }

  let loggedConnection = false;

  api.forwardPort({
    server,
    localAddress: '0.0.0.0',
    localPort: 9229,
    remoteAddress: '127.0.0.1',
    remotePort: 9227,
    onError(error) {
      console.error(error);
    },
    onReady() {
      console.log('Connected to server');
      console.log('');
      console.log('Debugger listening on ws://127.0.0.1:9229');
      console.log('');
      console.log('To debug:');
      console.log('1. Open chrome://inspect in Chrome');
      console.log('2. Select "Open dedicated DevTools for Node"');
      console.log('3. Wait a minute while it connects and loads the app.');
      console.log('   When it is ready, the app\'s files will appear in the Sources tab');
      console.log('');
      console.log('Warning: Do not use breakpoints when debugging a production server.');
      console.log('They will pause your server when hit, causing it to not handle methods or subscriptions.');
      console.log('Use logpoints or something else that does not pause the server');
      console.log('');
      console.log('The debugger will be enabled until the next time the app is restarted,');
      console.log('though only accessible while this command is running');
    },
    onConnection() {
      if (!loggedConnection) {
        // It isn't guaranteed the debugger is connected, but not many
        // other tools will try to connect to port 9229.
        console.log('');
        console.log('Detected by debugger');
        loggedConnection = true;
      }
    }
  });
}

export async function meteorShell(api) {
  const { app } = api.getConfig();
  const expandedServers = api.expandServers(app.servers);
  let serverOption = api.getArgs()[1];

  // Check how many sessions are enabled. Usually is all servers,
  // but can be reduced by the `--servers` option
  const enabledSessions = api.getSessionsForServers(Object.keys(app.servers))
    .filter(session => session);

  if (!(serverOption in expandedServers)) {
    if (enabledSessions.length === 1) {
      const selectedHost = enabledSessions[0]._host;
      serverOption = Object.keys(expandedServers).find(key =>
        expandedServers[key].server.host === selectedHost);
    } else {
      console.log('mup meteor shell <server>');
      console.log('Available servers are:\n', Object.keys(expandedServers).join('\n '));
      process.exitCode = 1;

      return;
    }
  }

  const server = expandedServers[serverOption].server;
  const sshOptions = api._createSSHOptions(server);

  const conn = new Client();
  conn.on('ready', () => {
    conn.exec(
      `docker exec -it ${app.name} node ./meteor-shell.js`,
      { pty: true },
      (err, stream) => {
        if (err) {
          throw err;
        }
        stream.on('close', () => {
          conn.end();
          process.exit();
        });

        process.stdin.setRawMode(true);
        process.stdin.pipe(stream);

        stream.pipe(process.stdout);
        stream.stderr.pipe(process.stderr);
        stream.setWindow(process.stdout.rows, process.stdout.columns);

        process.stdout.on('resize', () => {
          stream.setWindow(process.stdout.rows, process.stdout.columns);
        });
      });
  }).connect(sshOptions);
}

export async function destroy(api) {
  const config = api.getConfig();
  const options = api.getOptions();

  if (!options.force) {
    console.error('The destroy command completely removes the app from the server');
    console.error('If you are sure you want to continue, use the `--force` option');
    process.exit(1);
  } else {
    console.log('The app will be completely removed from the server.');
    console.log('Waiting 5 seconds in case you want to cancel by pressing ctr + c');
    await new Promise(resolve => setTimeout(resolve, 1000 * 5));
  }

  const list = nodemiral.taskList('Destroy App');
  const sessions = await getSessions(api);

  if (api.swarmEnabled()) {
    console.error('Destroying app when using swarm is not implemented');
    process.exit(1);
  }

  list.executeScript('Stop App', {
    script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.app.name
    }
  });

  list.executeScript('Destroy App', {
    script: api.resolvePath(__dirname, 'assets/meteor-destroy.sh'),
    vars: {
      name: config.app.name
    }
  });

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
  const expandedServers = api.expandServers(config.app.servers);
  const servers = Object.keys(expandedServers)
    .map(key => ({
      ...expandedServers[key].server,
      name: key,
      overrides: expandedServers[key].config
    }));

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

export async function listVersions(api) {
  const versions = await getVersions(api);
  console.log('Application versions:');
  // TODO: when using private docker registry, combine versions
  // and history to get a more complete list
  versions.versions.forEach(version => {
    let text = `  - ${version}`;

    if (version === versions.current) {
      text += ' (current)';
    } else if (version === versions.previous) {
      text += ' (previous)';
    } else if (versions.failed.includes(version)) {
      text += ' (failed)';
    }

    text = text.padEnd(17, ' ');

    let date = versions.versionDates.get(version);
    text += ` created ${date.toLocaleDateString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`;

    console.log(text);
  });

  console.log();
  console.log('Switch to a different version by running:');
  console.log('  mup meteor deploy-version <version>');
}
