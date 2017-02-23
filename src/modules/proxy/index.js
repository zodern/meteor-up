import debug from 'debug';
const log = debug('mup:module:proxy');

export function help(/* api */) {
  log('exec => mup proxy help');
}

export function setup(/* api */) {
  log('exec => mup proxy setup');
}
