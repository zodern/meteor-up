import * as commandHandlers from './command-handlers';

export let init = {
  description: 'Setup files for new mup project',
  handler: commandHandlers.init
};

export let deploy = {
  description: 'Deploy app to server',
  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandHandlers.deploy
};

export let logs = {
  description: "Show app\'s logs. Supports options from docker logs",
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

export let reconfig = {
  description: 'Updates server env and start script to match config',
  handler: commandHandlers.reconfig
};

export let restart = {
  description: 'Restart app',
  handler: commandHandlers.restart
};

export let setup = {
  description: 'Install dependencies, custom certificates, and MongoDB on server',
  handler: commandHandlers.setup
};

export let start = {
  description: 'Start app',
  handler: commandHandlers.start
};

export let stop = {
  description: 'Stop app',
  handler: commandHandlers.stop
};

export let ssh = {
  name: 'ssh [server]',
  description: 'SSH into server',
  handler: commandHandlers.ssh
};

export let validate = {
  description: 'validate config',
  builder(yargs) {
    return yargs.option('show', {
      description: 'Show config after being modified by plugins',
      bool: true
    });
  },
  handler: commandHandlers.validate
};
