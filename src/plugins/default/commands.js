import * as commandHandlers from './command-handlers';
import initHandler from './init';

export const init = {
  description: 'Setup files for new mup project',
  handler: initHandler
};

export const deploy = {
  description: 'Deploy app to server',
  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.deploy
};

export const logs = {
  description: 'Show app\'s logs. Supports options from docker logs',
  builder(yargs) {
    return yargs
      .strict(false)
      .option('tail', {
        description: 'Number of lines to show from the end of the logs',
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

export const reconfig = {
  description: 'Updates server env and start script to match config',
  handler: commandHandlers.reconfig
};

export const restart = {
  description: 'Restart app',
  handler: commandHandlers.restart
};

export const setup = {
  description: 'Install dependencies, custom certificates, and MongoDB on server',
  handler: commandHandlers.setup
};

export const start = {
  description: 'Start app',
  handler: commandHandlers.start
};

export const stop = {
  description: 'Stop app',
  handler: commandHandlers.stop
};

export const ssh = {
  name: 'ssh [server]',
  description: 'SSH into server',
  handler: commandHandlers.ssh,
  builder(yargs) {
    yargs.positional('server', {
      description: 'Name of server'
    }).strict(false);
  }
};

export const validate = {
  description: 'validate config',
  builder(yargs) {
    return yargs.option('show', {
      description: 'Show config after being modified by plugins',
      bool: true
    }).option('scrub', {
      description: 'Shows the config with sensitive information removed',
      bool: true
    });
  },
  handler: commandHandlers.validate
};

export const status = {
  description: 'View status of your app, databases and other components',
  handler: commandHandlers.status,
  builder(yargs) {
    return yargs.option('overview', {
      description: 'Simplified report to quickly see the status of each component',
      bool: true
    });
  }
};
