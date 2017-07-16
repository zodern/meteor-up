import * as handlers from './command-handlers';

export const setup = {
  description: 'Setup and start proxy',
  handler: handlers.setup
};

export const logs = {
  description: 'View logs for proxy',
  builder(yargs) {
    return yargs.strict(false);
  },
  handler: handlers.logs
};

export const envconfig = {
  description: 'Configure environment variables for proxy',
  handler: handlers.envconfig
};

export const start = {
  description: 'Start proxy and let\'s encrypt containers',
  handler: handlers.start
};

export const stop = {
  description: 'Stop proxy',
  handler: handlers.stop
};
