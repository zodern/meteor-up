export function checkAppStarted(list, api) {
  const script = api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh');
  const { app, proxy } = api.getConfig();
  const exposedPort = app.deployCheckPort || app.env.PORT || 80;
  const publishedPort = 80;

  list.executeScript('Verifying Deployment', {
    script,
    vars: {
      deployCheckWaitTime: app.deployCheckWaitTime || 60,
      appName: app.name,
      deployCheckPort: proxy ? publishedPort : exposedPort
    }
  });

  return list;
}
