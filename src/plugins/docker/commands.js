import * as commandHandlers from './command-handlers';

export let setup = {
  description: 'Install and start docker',
  handler: commandHandlers.setup
};

export let restart = {
  description: 'Restart docker daemon',
  handler: commandHandlers.restart
};

export let ps = {
  description: 'View running containers. Accepts same options as docker ps',
  builder(builder) {
    return builder.strict(false);
  },
  handler: commandHandlers.ps
};
