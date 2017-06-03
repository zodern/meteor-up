import * as commandFunctions from './tasks';

export let setup = {
  description: 'Prepare server to deploy meteor apps',
  handler: commandFunctions.setup
};

export let deploy = {
  description: 'Deploy meteor apps',
  builder(subYargs) {
    return subYargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandFunctions.deploy
};

export let logs = {
  description: 'View meteor app\'s logs',
  handler: commandFunctions.logs
};

export let start = {
  description: 'Start meteor app',
  handler: commandFunctions.start
};

export let stop = {
  description: 'Stop meteor app',
  handler: commandFunctions.stop
};
