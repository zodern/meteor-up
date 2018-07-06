import * as _commands from './commands';
import { addProxyEnv } from './utils';
import { updateProxyForService } from './command-handlers';
import validator from './validate';

export const description = 'Setup and manage reverse proxy and ssl';

export const commands = _commands;

export const validate = {
  proxy: validator
};

export function prepareConfig(config) {
  if (!config.app || !config.proxy) {
    return config;
  }

  const swarmEnabled = config.swarm === true;

  config.app.env = config.app.env || {};

  if (!swarmEnabled) {
    config.app.env = addProxyEnv(config, config.app.env);
  }

  config.app.env.HTTP_FORWARDED_COUNT =
    config.app.env.HTTP_FORWARDED_COUNT || 1;

  return config;
}

// This hook runs when setting up the proxy or running mup reconfig
// This creates a small container for the proxy to know about the service
function configureServiceHook(api) {
  const config = api.getConfig();

  if (config.proxy && config.swarm) {
    return updateProxyForService(api);
  }
}

export const hooks = {
  'post.default.status'(api) {
    if (api.getConfig().proxy) {
      api.runCommand('proxy.status');
    }
  },
  'post.setup'(api) {
    // Only run hook on "mup setup"
    const dockerSetup = api.commandHistory.find(({ name }) => name === 'default.setup');

    if (api.getConfig().proxy && dockerSetup) {
      return api.runCommand('proxy.setup');
    }
  },
  'post.reconfig': configureServiceHook,
  'post.proxy.setup': configureServiceHook
};

export function swarmOptions(config) {
  if (config && config.proxy) {
    return {
      managers: Object.keys(config.proxy.servers)
    };
  }
}
