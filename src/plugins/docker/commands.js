import * as commandFunctions from './command-handlers';

export let setup = {
  description: 'Install and start docker',
  handler: commandFunctions.setup
};

export let restart = {
  description: 'Restart docker daemon',
  handler: commandFunctions.restart
};

export let ps = {
  description: 'View running containers. Accepts same options as docker ps',
  builder(builder) {
    return builder.strict(false);
  },
  handler: commandFunctions.ps
};
