import * as commandFunctions from './index';
export let description = "Setup docker, and access it's commands";

export function commands(builder) {
  return builder
    .command('setup', 'Install and start docker', {}, commandFunctions.setup)
    .command('restart', 'Restart docker daemon', {}, commandFunctions.restart)
    .command(
      'ps',
      'View running containers. Accepts same options as docker ps',
      (subBuilder) => {
        return subBuilder.strict(false);
      },
      commandFunctions.ps
    )
    .strict(false);
}
