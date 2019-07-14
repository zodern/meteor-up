import * as _commands from './commands';
import { addProxyEnv, normalizeUrl } from './utils';
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

  const swarmEnabled = config.swarm && config.swarm.enabled;

  config.app.env = config.app.env || {};
  config.app.docker = config.app.docker || {};
  config.app.env = addProxyEnv(config, config.app.env);

  if (!swarmEnabled) {
    config.app.env.VIRTUAL_PORT = config.app.docker.imagePort || 3000;
  }

  config.app.env.HTTP_FORWARDED_COUNT =
  config.app.env.HTTP_FORWARDED_COUNT || 1;

  if (swarmEnabled) {
    config.app.docker.networks = config.app.docker.networks || [];
    config.app.docker.networks.push('mup-proxy');
  }

  config.app.env.ROOT_URL = normalizeUrl(config, config.app.env);

  return config;
}

// This hook runs when setting up the proxy or running mup reconfig
// This creates a small container for the proxy to know about the service
function configureServiceHook(api) {
  const config = api.getConfig();

  if (config.proxy && api.swarmEnabled()) {
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
    if (api.getConfig().proxy) {
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
