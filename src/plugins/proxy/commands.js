import * as commandHandlers from './command-handlers';

export const setup = {
  description: 'Setup and start proxy',
  handler: commandHandlers.setup
};

export const reconfigShared = {
  name: 'reconfig-shared',
  description: 'Reconfigure shared properties',
  handler: commandHandlers.reconfigShared
};

export const logs = {
  description: 'View logs for proxy',
  builder(yargs) {
    return yargs.strict(false);
  },
  handler: commandHandlers.logs
};

export const leLogs = {
  name: 'logs-le',
  description: 'View logs for Let\'s Encrypt',
  builder(yargs) {
    return yargs.strict(false);
  },
  handler: commandHandlers.leLogs
};

export const envconfig = {
  description: 'Configure environment variables for proxy',
  handler: commandHandlers.envconfig
};

export const start = {
  description: 'Start proxy and let\'s encrypt containers',
  handler: commandHandlers.start
};

export const stop = {
  description: 'Stop proxy',
  handler: commandHandlers.stop
};

export const nginxConfig = {
  name: 'nginx-config',
  description: 'View generated nginx config',
  handler: commandHandlers.nginxConfig
};

export const status = {
  description: 'View the proxy\'s status',
  handler: commandHandlers.status
};
