import * as commandFunctions from './tasks';

export let setup = {
  description: 'Installs and starts MongoDB',
  handler: commandFunctions.setup
};

export let logs = {
  description: 'View MongoDB logs',
  handler: commandFunctions.logs
};

export let start = {
  description: 'Start MongoDB',
  handler: commandFunctions.start
};

export let stop = {
  description: 'Stop MongoDB',
  handler: commandFunctions.stop
};
