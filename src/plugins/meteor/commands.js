import * as commandHandlers from './command-handlers';

export let setup = {
  description: 'Prepare server to deploy meteor apps',
  handler: commandHandlers.setup
};

export let deploy = {
  description: 'Deploy meteor apps',
  builder(subYargs) {
    return subYargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.deploy
};

export let logs = {
  description: 'View meteor app\'s logs',
  builder(yargs) {
    return yargs
      .strict(false)
      .option('tail', {
        description: 'Number of lines to show from the end of the logs',
        alias: 't',
        number: true
      })
      .option('follow', {
        description: 'Follow log output',
        alias: 'f',
        boolean: true
      });
  },
  handler: commandHandlers.logs
};

export let start = {
  description: 'Start meteor app',
  handler: commandHandlers.start
};

export let stop = {
  description: 'Stop meteor app',
  handler: commandHandlers.stop
};

export let restart = {
  description: 'Restart meteor app',
  handler: commandHandlers.restart
};

// Hidden commands
export const build = {
  description: false,
  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.build
};

export const push = {
  description: false,
  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.push
};

export const envconfig = {
  description: false,
  handler: commandHandlers.envconfig
};
