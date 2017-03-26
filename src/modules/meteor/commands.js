import * as commandFunctions from './index';

export const description = 'Deploy and manage meteor apps';

export function commands(yargs) {
  return yargs
    .command(
      'setup',
      'Prepare server to deploy meteor apps',
      {},
      commandFunctions.setup
    )
    .command('deploy', 'Deploy meteor app', subYargs => {
      return subYargs.option('cached-build', {
        description: 'Use build from previous deploy',
        boolean: true
      });
    }, commandFunctions.deploy)
    .command('logs', 'View meteor app\'s logs', {}, commandFunctions.logs)
    .command('start', 'Start meteor app', {}, commandFunctions.start)
    .command('stop', 'Stop meteor app', {}, commandFunctions.stop);
}
