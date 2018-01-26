import chalk from 'chalk';
import { clone } from 'lodash';
import debug from 'debug';
import fs from 'fs';
import nodemiral from 'nodemiral';

const log = debug('mup:module:proxy');
const PROXY_CONTAINER_NAME = 'mup-nginx-proxy';

export function logs(api) {
  log('exec => mup proxy logs');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs().slice(1);
  const sessions = api.getSessions(['app']);

  return api.getDockerLogs(PROXY_CONTAINER_NAME, sessions, args);
}

export function leLogs(api) {
  log('exec => mup proxy le-logs');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs().slice(1);
  args[0] = 'logs';
  const sessions = api.getSessions(['app']);

  return api.getDockerLogs(
    `${PROXY_CONTAINER_NAME}-letsencrypt`,
    sessions,
    args
  );
}

export function setup(api) {
  log('exec => mup proxy setup');
  const config = api.getConfig().proxy;
  const appName = api.getConfig().app.name;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup proxy');
  const domains = config.domains.split(',');

  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/proxy-setup.sh'),
    vars: {
      name: PROXY_CONTAINER_NAME
    }
  });

  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/start.sh`,
    vars: {
      appName: PROXY_CONTAINER_NAME,
      letsEncryptEmail: config.ssl ? config.ssl.letsEncryptEmail : null
    }
  });

  let nginxServerConfig = '';
  if (config.nginxServerConfig) {
    nginxServerConfig = fs.readFileSync(
      api.resolvePath(api.getBasePath(), config.nginxServerConfig)
    ).toString('utf8');
  }

  let nginxLocationConfig = '';
  if (config.nginxLocationConfig) {
    nginxLocationConfig = fs.readFileSync(
      api.resolvePath(api.getBasePath(), config.nginxLocationConfig)
    ).toString('utf8');
  }

  list.executeScript('Pushing Nginx Config', {
    script: api.resolvePath(__dirname, 'assets/nginx-config.sh'),
    vars: {
      hasServerConfig: config.nginxServerConfig,
      hasLocationConfig: config.nginxLocationConfig,
      serverConfig: nginxServerConfig,
      locationConfig: nginxLocationConfig,
      domains,
      proxyName: PROXY_CONTAINER_NAME
    }
  });

  list.executeScript('Cleaning Up SSL Certificates', {
    script: api.resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
    vars: {
      name: appName,
      proxyName: PROXY_CONTAINER_NAME
    }
  });

  if (
    config.ssl &&
    !config.ssl.letsEncryptEmail &&
    config.ssl.upload !== false &&
    config.ssl.crt
  ) {
    list.copy('Copying SSL Certificate Bundle', {
      src: api.resolvePath(api.getBasePath(), config.ssl.crt),
      dest: `/opt/${appName}/config/bundle.crt`
    });
    list.copy('Copying SSL Private Key', {
      src: api.resolvePath(api.getBasePath(), config.ssl.key),
      dest: `/opt/${appName}/config/private.key`
    });
    list.executeScript('Setup SSL Certificates for Domains', {
      script: api.resolvePath(__dirname, 'assets/ssl-setup.sh'),
      vars: {
        appName,
        proxyName: PROXY_CONTAINER_NAME,
        domains
      }
    });
  }

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  }).then(() => api.runCommand('proxy.start'));
}

export function reconfigShared(api) {
  const config = api.getConfig().proxy;
  const shared = config.shared || {};

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  console.log('The shared settings affect all apps using this reverse proxy.');

  if (Object.keys(shared).length === 0) {
    console.log('No shared config properties are set. Resetting proxy to defaults.');
  }

  const list = nodemiral.taskList('Configuring Proxy\'s Shared Settings');

  list.copy('Sending shared variables', {
    src: api.resolvePath(__dirname, 'assets/templates/shared-config.sh'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/shared-config.sh`,
    vars: {
      httpPort: shared.httpPort,
      httpsPort: shared.httpsPort,
      clientUploadLimit: shared.clientUploadLimit
    }
  });

  const env = clone(shared.env);

  list.copy('Sending proxy environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/env.list`,
    vars: {
      env: env || {}
    }
  });

  const envLetsEncrypt = clone(shared.envLetsEncrypt);

  list.copy('Sending let\'s encrypt environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/env_letsencrypt.list`,
    vars: {
      env: envLetsEncrypt || {}
    }
  });

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  }).then(() => api.runCommand('proxy.start'));
}

export function start(api) {
  log('exec => mup proxy start');
  const config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const list = nodemiral.taskList('Start proxy');

  list.executeScript('Start proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-start.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

export function stop(api) {
  log('exec => mup proxy stop');

  const list = nodemiral.taskList('Stop proxy');

  list.executeScript('Stop proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-stop.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  const sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export async function nginxConfig(api) {
  log('exec => mup proxy nginx-config');

  const command = `docker exec ${PROXY_CONTAINER_NAME} cat /etc/nginx/conf.d/default.conf`;
  const { servers, app } = api.getConfig();
  const serverObjects = Object.keys(app.servers)
    .map(serverName => servers[serverName]);


  await Promise.all(
    serverObjects.map(server =>
      api.runSSHCommand(server, command)
    )
  ).then(results => {
    results.forEach(({ host, output }) => {
      console.log(`===== ${host} ======`);
      console.log(output);
    });
  });
}

export async function status(api) {
  const config = api.getConfig();
  const servers = Object.keys(config.app.servers)
    .map(key => config.servers[key]);
  const lines = [];
  const overallColor = 'green';

  const collectorConfig = {
    nginxDocker: {
      command: `docker inspect ${PROXY_CONTAINER_NAME} --format "{{json .}}"`,
      parser: 'json'
    },
    letsEncryptDocker: {
      command: `docker inspect ${PROXY_CONTAINER_NAME}-letsencrypt --format "{{json .}}"`,
      parser: 'json'
    },
    certificateExpire: {
      command: `cd /opt/${PROXY_CONTAINER_NAME}/mounted-certs && find . -name '*.chain.pem' -exec echo '{}' \\; -exec openssl x509 -enddate -noout -in '{}' \\;`,
      parser(stdout, code) {
        if (code === 0) {
          return stdout.split('\n').reduce((result, item, index, items) => {
            if (!(index % 2) && item.trim() !== '') {
              result[item.slice(2)] = items[index + 1].split('=')[1];
            }

            return result;
          }, {});
        }

        return null;
      }
    }
  };

  const serverInfo = await api.getServerInfo(servers, collectorConfig);

  Object.values(serverInfo).forEach(
    ({ _host, nginxDocker, letsEncryptDocker, certificateExpire }) => {
      lines.push(` - ${_host}:`);
      lines.push('   - NGINX:');
      lines.push(`     - Status: ${nginxDocker ? nginxDocker.State.Status : 'Stopped'}`);

      // TODO: instead, show https and http port
      if (nginxDocker) {
        lines.push('     - Ports:');
        Object.keys(nginxDocker.NetworkSettings.Ports || {}).forEach(key => {
          if (nginxDocker.NetworkSettings.Ports[key]) {
            lines.push(`       - ${key} => ${nginxDocker.NetworkSettings.Ports[key][0].HostPort}`);
          }
        });
      }

      lines.push('   - Let\'s Encrypt');
      lines.push(`     - Status: ${letsEncryptDocker ? letsEncryptDocker.State.Status : 'Stopped'}`);

      if (certificateExpire && certificateExpire.length > 0) {
        lines.push('     - Certificates');
        Object.keys(certificateExpire).forEach(key => {
          lines.push(`       - ${key}: ${certificateExpire[key]}`);
        });
      }
    });

  console.log(chalk[overallColor]('\n=> Reverse Proxy Status'));
  console.log(lines.join('\n'));
}
