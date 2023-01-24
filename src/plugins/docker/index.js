import { uniqueSessions } from './command-handlers';
import * as _commands from './commands';
import { validateRegistry, validateSwarm } from './validate';

export const description = 'Setup and manage docker';
export const commands = _commands;

export const hooks = {
  'post.default.status'(api) {
    return api.runCommand('docker.status');
  }
};

export const validate = {
  swarm: validateSwarm,
  privateDockerRegistry: validateRegistry
};

export function swarmOptions(config) {
  if (config && config.swarm) {
    return {
      labels: config.swarm.labels || []
    };
  }
}

export function prepareConfig(config) {
  if (!config.privateDockerRegistry) {
    return;
  }

  return config;
}

export function scrubConfig(config) {
  if (!config.privateDockerRegistry) {
    return config;
  }

  const {
    username,
    password
  } = config.privateDockerRegistry;

  if (username) {
    config.privateDockerRegistry.username = 'username';
  }
  if (password) {
    config.privateDockerRegistry.password = 'password';
  }

  return config;
}

export async function checkSetup(api) {
  const sessions = await uniqueSessions(api);
  const config = api.getConfig();

  return [
    {
      sessions,
      name: 'docker',
      setupKey: {
        scripts: [
          api.resolvePath(__dirname, 'assets/docker-setup.sh'),
          api.resolvePath(__dirname, 'assets/install-docker.sh')
        ],
        config: {
          privateDockerRegistry: config.privateDockerRegistry,
          // TODO: fix this to avoid always needing to setup everytime when
          // swarm is enabled
          swarm: api.swarmEnabled() ? Date.now() : false
        }
      },
      services: ['docker']
    }
  ];
}
