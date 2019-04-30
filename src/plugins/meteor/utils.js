import { cloneDeep, flatMap } from 'lodash';
import fs from 'fs';
import os from 'os';
import random from 'random-seed';
import uuid from 'uuid';

export function checkAppStarted(list, api) {
  const script = api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh');
  const { app } = api.getConfig();
  const publishedPort = app.docker.imagePort || 80;

  list.executeScript('Verifying Deployment', {
    script,
    vars: {
      deployCheckWaitTime: app.deployCheckWaitTime || 60,
      appName: app.name,
      deployCheckPort: publishedPort
    }
  });

  return list;
}

export function addStartAppTask(list, api) {
  const appConfig = api.getConfig().app;
  const isDeploy = api.commandHistory.find(({ name }) => name === 'meteor.deploy');

  list.executeScript('Start Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: appConfig.name,
      removeImage: isDeploy && !prepareBundleSupported(appConfig.docker)
    }
  });

  return list;
}

export function prepareBundleSupported(dockerConfig) {
  const supportedImages = ['abernix/meteord', 'zodern/meteor'];

  if ('prepareBundle' in dockerConfig) {
    return dockerConfig.prepareBundle;
  }

  return supportedImages.find(
    supportedImage => dockerConfig.image.indexOf(supportedImage) === 0
  ) || false;
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

export function getNodeVersion(api, bundlePath) {
  let star = fs.readFileSync(api.resolvePath(bundlePath, 'bundle/star.json')).toString();
  let nodeVersion = fs.readFileSync(api.resolvePath(bundlePath, 'bundle/.node_version.txt')).toString().trim();

  star = JSON.parse(star);
  // Remove leading 'v'
  nodeVersion = nodeVersion.substr(1);

  return star.nodeVersion || nodeVersion;
}

export async function getSessions(api) {
  if (api.swarmEnabled()) {
    return [
      await api.getManagerSession()
    ];
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

export function getBuildOptions(api) {
  const config = api.getConfig().app;
  const appPath = api.resolvePath(api.getBasePath(), config.path);

  const buildOptions = config.buildOptions || {};

  buildOptions.buildLocation =
    buildOptions.buildLocation || tmpBuildPath(appPath, api);

  return buildOptions;
}

export function shouldRebuild(api) {
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

export function configHasMailUrl(config) {
  return config && config.app && config.app.env && config.app.env.MAIL_URL;
}

export function configHasMongoUrl(config) {
  return config && config.app && config.app.env && config.app.env.MONGO_URL;
}

export function normalizeMailUrl(mailUrl) {
  let url = mailUrl;

  // Regex get everything what's between smtp|smtps:// and the last @
  const re = /^(smtp|smtps):\/\/(.*)@/g.exec(url);

  if (re && re.length > 0) {
    const arr = re[2].split(':');

    // Username is returned by .shift() if needed
    arr.shift();

    // Use arr.join('') because user might have more that one : in the pass
    const fullpassword = arr.join('');
    const encodedPassword = encodeURIComponent(fullpassword);

    url = url.replace(fullpassword, encodedPassword);
  }

  return url;
}

export function normalizeMongoUrl(mongoUrl) {
  let url = mongoUrl;

  // Regex get everything what's between mongodb:// and the last @
  const re = /mongodb:\/\/(.*)@/g.exec(url);

  if (re && re.length > 0) {
    const arr = re[1].split(':');

    // Username is returned by .shift() if needed
    arr.shift();

    // Use arr.join('') because user might have more that one : in the pass
    const fullpassword = arr.join('');
    const encodedPassword = encodeURIComponent(fullpassword);

    url = url.replace(fullpassword, encodedPassword);
  }

  return url;
}
export function currentImageTag(serverInfo, appName) {
  const result = flatMap(
    Object.values(serverInfo),
    ({images}) => images || []
  )
    .filter(image => image.Repository === `mup-${appName}`)
    .map(image => parseInt(image.Tag, 10))
    .filter(tag => !isNaN(tag))
    .sort((a, b) => b - a);

  return result[0] || 0;
}
