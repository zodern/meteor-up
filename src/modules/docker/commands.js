import * as commandFunctions from './index';
export let description = "Setup docker, and access it's commands";

export function commands(yargs) {
  return yargs
    .command('setup', 'Install and start docker', {}, commandFunctions.setup)
    .command('restart', 'Restart docker daemon', {}, commandFunctions.restart)
    .command(
      'ps',
      'View running containers. Accepts same options as docker ps',
      {},
      commandFunctions.ps
    );
}
