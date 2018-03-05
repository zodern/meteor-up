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

export function prepareBundleSupported(dockerConfig) {
  const supportedImages = ['abernix/meteord', 'zodern/meteor'];

  if ('prepareBundle' in dockerConfig) {
    return dockerConfig.prepareBundle;
  }

  return supportedImages.find(
    supportedImage => dockerConfig.image.indexOf(supportedImage) === 0
  ) || false;
}
