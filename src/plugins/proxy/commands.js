export const setup = {
  description: 'Setup and start proxy',
  task: 'proxy.setup'
};

export const logs = {
  description: 'View logs for proxy',
  task: 'proxy.logs'
};

export const envconfig = {
  description: 'Configure environment variables for proxy',
  task: 'proxy.envconfig'
};

export const start = {
  description: 'Start proxy and let\'s encrypt containers',
  task: 'proxy.start'
};

export const stop = {
  description: 'Stop proxy',
  task: 'proxy.stop'
};
