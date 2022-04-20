import * as uuid from 'uuid';
import { cloneDeep } from 'lodash';
import fs from 'fs';
import os from 'os';
import {
  prepareBundleSupported
} from './prepare-bundle.js';
import random from 'random-seed';
import { spawn } from 'child_process';
import tar from 'tar';

export function checkAppStarted(list, api, { canRollback, recordFailed } = {}) {
  const script = api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh');
  const { app, privateDockerRegistry } = api.getConfig();
  const publishedPort = app.docker.imagePort || 80;

  list.executeScript('Verifying Deployment', {
    script,
    vars: {
      deployCheckWaitTime: app.deployCheckWaitTime || 60,
      appName: app.name,
      deployCheckPort: publishedPort,
      privateRegistry: privateDockerRegistry,
      imagePrefix: getImagePrefix(privateDockerRegistry),
      canRollback: canRollback || false,
      recordFailed: recordFailed || false
    }
  });

  return list;
}

export function addStartAppTask(list, api, { isDeploy, version } = {}) {
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();

  list.executeScript('Start Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: appConfig.name,
      removeImage: isDeploy && !prepareBundleSupported(appConfig.docker),
      privateRegistry: privateDockerRegistry,
      version: typeof version === 'number' ? version : null
    }
  });

  return list;
}

export function createEnv(appConfig, settings) {
  const env = cloneDeep(appConfig.env);

  env.METEOR_SETTINGS = JSON.stringify(settings);

  // setting PORT in the config is used for the publicly accessible
  // port.
  // docker.imagePort is used for the port exposed from the container.
  // In case the docker.imagePort is different than the container's
  // default port, we set the env PORT to docker.imagePort.
  env.PORT = appConfig.docker.imagePort;

  return env;
}

export function createServiceConfig(api, tag) {
  const {
    app,
    proxy
  } = api.getConfig();

  return {
    image: `mup-${app.name.toLowerCase()}:${tag || 'latest'}`,
    name: app.name,
    env: createEnv(app, api.getSettings()),
    replicas: Object.keys(app.servers).length,
    endpointMode: proxy ? 'dnsrr' : 'vip',
    networks: app.docker.networks,
    hostname: `{{.Node.Hostname}}-${app.name}-{{.Task.ID}}`,
    publishedPort: proxy ? null : app.env.PORT || 80,
    targetPort: proxy ? null : app.docker.imagePort,
    updateFailureAction: 'rollback',
    updateParallelism: Math.ceil(Object.keys(app.servers).length / 3),
    updateDelay: 20 * 1000,
    constraints: [
      `node.labels.mup-app-${app.name}==true`
    ]
  };
}

export async function getNodeVersion(bundlePath) {
  let star = await readFileFromTar(bundlePath, 'bundle/star.json');
  star = JSON.parse(star || '{}');

  // star.json started having nodeVersion in Meteor 1.5.2
  if (star && star.nodeVersion) {
    return star.nodeVersion;
  }

  const nodeVersion = await readFileFromTar(bundlePath, 'bundle/.node_version.txt');

  // Remove leading 'v'
  return nodeVersion.trim().substr(1);
}

export function escapeEnvQuotes(env) {
  return Object.entries(env).reduce((result, [key, _value]) => {
    let value = _value;

    if (typeof value === 'string') {
      value = value.replace(/"/, '\\"');
    }
    result[key] = value;

    return result;
  }, {});
}

export async function getSessions(api) {
  if (api.swarmEnabled()) {
    return [await api.getManagerSession()];
  }

  return api.getSessions(['app']);
}

export function tmpBuildPath(appPath, api) {
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

export function runCommand(_executable, _args, { cwd, stdin } = {}) {
  return new Promise((resolve, reject) => {
    let executable = _executable;
    let args = _args;
    const isWin = /^win/.test(process.platform);
    if (isWin) {
      // Sometimes cmd.exe not available in the path
      // See: http://goo.gl/ADmzoD
      executable = process.env.comspec || 'cmd.exe';
      args = ['/c', _executable].concat(args);
    }

    const options = {
      cwd,
      stdio: [
        stdin ? 'pipe' : process.stdin,
        process.stdout,
        process.stderr
      ]
    };
    const commandProcess = spawn(executable, args, options);

    if (stdin) {
      commandProcess.stdin.setEncoding('utf-8');
      commandProcess.stdin.write(`${stdin}\r\n`);
      commandProcess.stdin.end();
    }

    commandProcess.on('error', e => {
      console.log(options);
      console.log(e);
      console.log(`This error usually happens when ${_executable} is not installed.`);

      return reject(e);
    });
    commandProcess.on('close', code => {
      if (code > 0) {
        return reject(new Error(`"${executable} ${args.join(' ')}" exited with the code ${code}`));
      }

      resolve();
    });
  });
}

export function shouldRebuild(api) {
  let rebuild = true;
  const { buildLocation } = api.getConfig().app.buildOptions;
  const bundlePath = api.resolvePath(buildLocation, 'bundle.tar.gz');

  if (api.getOptions()['cached-build']) {
    const buildCached = fs.existsSync(bundlePath);

    // If build is not cached, rebuild remains true
    // even though the --cached-build flag was used
    if (buildCached) {
      rebuild = false;
    }
  }

  return rebuild;
}

export function getImagePrefix(privateRegistry) {
  if (privateRegistry && privateRegistry.imagePrefix) {
    return `${privateRegistry.imagePrefix}/mup-`;
  }

  return 'mup-';
}

function mostCommon(values) {
  let counts = new Map();
  values.forEach(value => {
    let number = counts.get(value) || 0;
    counts.set(value, number + 1);
  });

  if (counts.size === 0) {
    return null;
  }

  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

export async function getVersions(api) {
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();

  const imageName = `${getImagePrefix(privateDockerRegistry)}${appConfig.name.toLowerCase()}`;

  const collector = {
    images: {
      command: `sudo docker images ${imageName} --format '{{json .}}'`,
      parser: 'jsonArray'
    },
    history: {
      command: `cat /opt/${appConfig.name}/config/version-history.txt`,
      parser: 'text'
    },
    failed: {
      command: `cat /opt/${appConfig.name}/config/failed-versions.txt`,
      parser: 'text'
    }
  };

  const data = await api.getServerInfo(
    Object.keys(api.expandServers(appConfig.servers)),
    collector
  );
  const result = {
    latest: 0,
    versions: [],
    servers: [],
    failed: [],
    versionDates: new Map()
  };

  Object.values(data).forEach(entry => {
    let serverVersions = [];

    entry.images.forEach(image => {
      let version = parseInt(image.Tag, 10);
      if (!Number.isNaN(version)) {
        serverVersions.push(version);
      }

      let date = new Date(image.CreatedAt);
      let existingDate = result.versionDates.get(version);
      if (!existingDate || existingDate.getTime() > date.getTime()) {
        result.versionDates.set(version, date);
      }
    });

    result.versions.push(...serverVersions);

    const serverFailed = entry.failed ? entry.failed.split('\n').map(v => parseInt(v, 10)) : [];
    result.failed.push(...serverFailed);

    const history = entry.history ? entry.history.split('\n').map(v => parseInt(v, 10)) : [];

    result.servers.push({
      host: entry._host,
      name: entry._serverName,
      current: history[history.length - 1] || null,
      previous: history[history.length - 2] || null,
      versions: serverVersions.sort((a, b) => b - a),
      history,
      failed: serverFailed
    });
  });

  result.versions = Array.from(new Set(result.versions)).sort((a, b) => b - a);
  result.failed = Array.from(new Set(result.failed));
  result.latest = result.versions[0] || 0;
  result.current = mostCommon(result.servers.map(server => server.current));
  result.previous = mostCommon(result.servers.map(server => server.previous));

  return result;
}

export function readFileFromTar(tarPath, filePath) {
  const data = [];
  let found = false;

  const onentry = entry => {
    if (entry.path === filePath) {
      found = true;
      entry.on('data', d => data.push(d));
    }
  };

  return new Promise((resolve, reject) => {
    tar.t({
      onentry,
      file: tarPath
    }, err => {
      if (err) {
        return reject(err);
      }

      if (!found) {
        return reject(new Error('file-not-found'));
      }

      const combined = Buffer.concat(data);
      resolve(combined.toString('utf-8'));
    });
  });
}
