import * as commandHandlers from './command-handlers';

export let setup = {
  description: 'Installs and starts MongoDB',
  handler: commandHandlers.setup
};

export let logs = {
  description: 'View MongoDB logs',
  handler: commandHandlers.logs
};

export let start = {
  description: 'Start MongoDB',
  handler: commandHandlers.start
};

export let stop = {
  description: 'Stop MongoDB',
  handler: commandHandlers.stop
};
