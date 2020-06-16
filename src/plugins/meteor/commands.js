import * as commandHandlers from './command-handlers';

export const setup = {
  description: 'Prepare server to deploy meteor apps',
  handler: commandHandlers.setup
};

export const deploy = {
  description: 'Deploy meteor apps',
  builder(subYargs) {
    return subYargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.deploy
};

export const destroy = {
  description: 'Stop and completely remove app from server',
  handler: commandHandlers.destroy,
  builder(subYargs) {
    return subYargs.option('force', {
      description: 'forces app to be removed',
      boolean: true
    });
  }
};

export const logs = {
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

export const start = {
  description: 'Start meteor app',
  handler: commandHandlers.start
};

export const stop = {
  description: 'Stop meteor app',
  handler: commandHandlers.stop
};

export const restart = {
  description: 'Restart meteor app',
  handler: commandHandlers.restart
};

export const status = {
  description: 'View the app\'s status',
  handler: commandHandlers.status,
  builder(yargs) {
    return yargs.option('overview', {
      description: 'Simplified report to quickly see the status of each component',
      bool: true
    });
  }
};

export const debug = {
  name: 'debug [server]',
  description: 'Debug the meteor app',
  builder(yargs) {
    yargs.strict(false);
  },
  handler: commandHandlers.debugApp
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
