import axios from 'axios';
import chalk from 'chalk';

export function getInformation(server, appName, api) {
  return api.runSSHCommand(server, `docker inspect ${appName} --format "{{json .}}"`)
    // eslint-disable-next-line complexity
    .then(({ host, output }) => {
      let info;
      const stoppedResult = {
        statusColor: 'red',
        status: 'Stopped',
        host: server.host
      };

      try {
        // Sometimes there are warnings shown before the JSON output
        const jsonOutput = output.slice(output.indexOf('{'));
        info = JSON.parse(jsonOutput.trim());
      } catch (e) {
        return stoppedResult;
      }

      if (!info.State) {
        return stoppedResult;
      }

      let statusColor = 'green';
      if (info.State.Restarting) {
        statusColor = 'yellow';
      } else if (!info.State.Running) {
        statusColor = 'red';
      }

      const publishedPorts = [];
      const exposedPorts = [];
      if (info.NetworkSettings) {
        Object.keys(info.NetworkSettings.Ports || {}).forEach(key => {
          if (info.NetworkSettings.Ports[key]) {
            publishedPorts.push(`${key} => ${info.NetworkSettings.Ports[key][0].HostPort}`);
          } else {
            exposedPorts.push(key);
          }
        });
      }

      const env = {};
      if (info.Config && info.Config.Env) {
        info.Config.Env.forEach(envVariable => {
          const name = envVariable.split('=')[0];
          env[name] = envVariable;
        });
      }

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

async function checkUrlLocally(server, appConfig, port) {
  let result;

  let portString = `:${port}`;
  let domain = server.host;
  if (appConfig.env.VIRTUAL_HOST) {
    domain = appConfig.env.VIRTUAL_HOST.split(',')[0];
    // TODO: this should use the proxy's port if the user changed it
    portString = '';
  }

  let protocol = 'http://';

  if (appConfig.env.ROOT_URL.startsWith('https://')) {
    protocol = 'https://';
  }

  try {
    result = await axios.head(`${protocol}${domain}${portString}`, {
      timeout: 5000
    });
  } catch (e) {
    result = false;
  }

  return result;
}

function getCheckAddress(server, appConfig) {
  if (
    appConfig.servers &&
    appConfig.servers[server.name] &&
    appConfig.servers[server.name].bind
  ) {
    return appConfig.servers[server.name].bind;
  }

  if (appConfig.docker && appConfig.docker.bind) {
    return appConfig.docker.bind;
  }

  return '127.0.0.1';
}

export async function checkUrls(server, appConfig, api) {
  const port = appConfig.servers[server.name].env ?
    appConfig.servers[server.name].env.PORT :
    appConfig.env.PORT;

  const [
    remote,
    inDocker,
    local
  ] = await Promise.all([
    api.runSSHCommand(server, `curl ${getCheckAddress(server, appConfig)}:${port}`),
    api.runSSHCommand(server, `docker exec ${appConfig.name} curl http://localhost:${appConfig.docker.imagePort}`),
    checkUrlLocally(server, appConfig, port)
  ]);
  const inDockerResult = inDocker.code === 0;
  const remoteResult = remote.code === 0;
  const localResult = local !== false;

  return {
    inDocker: inDockerResult,
    inDockerColor: inDockerResult ? 'green' : 'red',
    remote: remoteResult,
    remoteColor: remoteResult ? 'green' : 'red',
    local: localResult,
    localColor: localResult ? 'green' : 'red'
  };
}

export function createPortInfoLines(
  exposedPorts = [], publishedPorts = [], statusDisplay
) {
  if (exposedPorts.length > 0) {
    const exposedSection = statusDisplay.addLine('Exposed Ports:');
    exposedPorts.forEach(port => {
      exposedSection.addLine(`- ${port}`);
    });
  }

  if (publishedPorts.length > 0) {
    const publishedSection = statusDisplay.addLine('Published Ports (Inside Container => On Server):');
    publishedPorts.forEach(port => {
      publishedSection.addLine(`- ${port}`);
    });
  }
}

export function withColor(color, text) {
  return chalk[color](text);
}

export function displayAvailability(result, urlResult, statusDisplay) {
  if (result.publishedPorts && result.publishedPorts.length > 0) {
    const section = statusDisplay.addLine(`App running at http://${result.host}:${result.publishedPorts[0].split('=>')[1].trim()}`);
    section.addLine(`- Available in app's docker container: ${urlResult.inDocker}`, urlResult.inDockerColor);
    section.addLine(`- Available on server: ${urlResult.remote}`, urlResult.remoteColor);
    section.addLine(`- Available on local computer: ${urlResult.local}`, urlResult.localColor);
  } else {
    const section = statusDisplay.addLine('App available through reverse proxy');
    section.addLine(`- Available in app's docker container: ${urlResult.inDocker}`, urlResult.inDockerColor);
  }
}
