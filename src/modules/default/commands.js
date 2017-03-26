import * as commandFunctions from './index';
export function commands(parser) {
  return parser
    .command('init', 'Setup files for new mup project', {}, commandFunctions.init)
    .command(
      'deploy',
      'Deploy app to servers',
      yargs => {
        return yargs.option('cached-build', {
          description: 'Use build from previous deploy',
          boolean: true
        });
      },
      commandFunctions.deploy
    )
    .command(
      'logs',
      "Show app's logs. Supports options from docker logs",
      yargs => {
        return yargs
          .strict(false)
          .option('tail', {
            description: 'Number of lines to show from the end of the logs',
            number: true,
            default: 'all'
          })
          .option('follow', {
            description: 'Follow log output',
            alias: 'f',
            boolean: true
          });
      },
      commandFunctions.logs
    )
    .command('reconfig', 'Updates server env and start script to match config', {}, commandFunctions.reconfig)
    .command('restart', 'Restart apps', {}, commandFunctions.restart)
    .command('setup', 'Install depedencies on server, setups custom certificates and mongodb to match config', {}, commandFunctions.setup)
    .command('start', 'Start app', {}, commandFunctions.start)
    .command('stop', 'Stop app', {}, commandFunctions.stop);
}
