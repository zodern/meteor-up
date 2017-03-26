import * as commandFunctions from './';
export let description = 'Commands to manage MongoDB';
export function commands(parser) {
  return parser
    .command('setup', 'Installs and starts MongoDB', {}, commandFunctions.setup)
    .command('logs', 'View MongoDB logs', {}, commandFunctions.logs)
    .command('start', 'Start MongoDB', {}, commandFunctions.start)
    .command('stop', 'Stop MongoDB', {}, commandFunctions.stop);
}
