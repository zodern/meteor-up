import * as commandFunctions from './tasks';

export let init = {
  description: 'Setup files for new mup project',
  handler: commandFunctions.init
};

export let deploy = {
  description: 'Deploy app to server',
  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },
  handler: commandFunctions.deploy
};

export let logs = {
  description: "Show app\'s logs. Supports options from docker logs",
  builder(yargs) {
    return yargs
      .strict(false)
      .option('tail', {
        description: 'Number of lines to show form the end of the logs',
        number: true
      })
      .option('follow', {
        description: 'Follow log output',
        alias: 'f',
        boolean: true
      });
  },
  handler: commandFunctions.logs
};

export let reconfig = {
  description: 'Updates server env and start script to match config',
  handler: commandFunctions.reconfig
};

export let restart = {
  description: 'Restart app',
  handler: commandFunctions.restart
};

export let setup = {
  description: 'Install dependencies, custom certificates, and MongoDB on server',
  handler: commandFunctions.setup
};

export let start = {
  description: 'Start app',
  handler: commandFunctions.start
};

export let stop = {
  description: 'Stop app',
  handler: commandFunctions.stop
};
