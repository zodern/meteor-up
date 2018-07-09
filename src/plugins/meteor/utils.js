import { cloneDeep } from 'lodash';

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
