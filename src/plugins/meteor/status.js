export function getInformation(server, appName, api) {
  return api.runSSHCommand(server, `docker inspect ${appName} --format "{{json .}}"`)
    .then(({ host, output }) => {
      const info = JSON.parse(output.trim());

      let statusColor = 'green';
      if (info.State.Restarting) {
        statusColor = 'yellow';
      } else if (!info.State.Running) {
        statusColor = 'red';
      }

      const publishedPorts = [];
      const exposedPorts = [];
      Object.keys(info.NetworkSettings.Ports || {}).forEach(key => {
        if (info.NetworkSettings.Ports[key]) {
          publishedPorts.push(`${key} => ${info.NetworkSettings.Ports[key][0].HostPort}`);
        } else {
          exposedPorts.push(key);
        }
      });

      const env = {};
      info.Config.Env.forEach(envVariable => {
        const name = envVariable.split('=')[0];
        env[name] = envVariable;
      });

      const restartCount = info.RestartCount;
      let restartColor = 'green';
      if (restartCount > 0) {
        restartColor = 'yellow';
      } else if (restartCount > 2) {
        restartColor = 'red';
      }

      return {
        host,
        created: info.Created,
        status: info.State.Status,
        statusColor,
        env: Object.values(env),
        restartCount,
        restartColor,
        publishedPorts,
        exposedPorts
      };
    });
}
