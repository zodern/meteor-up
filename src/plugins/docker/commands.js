import * as commandHandlers from './command-handlers';

export const setup = {
  description: 'Install and start docker',
  handler: commandHandlers.setup
};

export const restart = {
  description: 'Restart docker daemon',
  handler: commandHandlers.restart
};

export const ps = {
  description: 'View running containers. Accepts same options as docker ps',
  builder(builder) {
    return builder.strict(false);
  },
  handler: commandHandlers.ps
};

export const status = {
  description: 'View status of docker swarm',
  handler: commandHandlers.status
};

export const update = {
  description: 'Update docker',
  handler: commandHandlers.update
};

export const destroyCluster = {
  name: 'destroy-cluster',
  description: 'Destroy swarm cluster',
  handler: commandHandlers.removeSwarm
};
