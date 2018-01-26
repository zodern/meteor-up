import axios from 'axios';

export function getInformation(server, appName, api) {
  return api.runSSHCommand(server, `docker inspect ${appName} --format "{{json .}}"`)
    .then(({ host, output }) => {
      let info;

      try {
        info = JSON.parse(output.trim());
      } catch (e) {
        return {
          statusColor: 'red',
          status: 'Stopped',
          host: server.host
        };
      }

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

export async function checkUrls(server, appConfig, api) {
  const remote = await api.runSSHCommand(server, `curl 127.0.0.1:${appConfig.env.PORT}`);
  const inDocker = await api.runSSHCommand(server, `docker exec ${appConfig.name} curl http://localhost:${appConfig.docker.imagePort}`);
  let local;

  try {
    local = await axios.get(`http://${server.host}:${appConfig.env.PORT}`);
  } catch (e) {
    local = false;
  }

  return {
    inDocker: inDocker.code === 0,
    remote: remote.code === 0,
    local: local !== false
  };
}
