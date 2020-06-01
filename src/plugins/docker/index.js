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
