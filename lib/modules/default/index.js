import path from 'path';
import debug from 'debug';
import sh from 'shelljs';
import * as meteor from '../meteor/';
import * as mongo from '../mongo/';
const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy(api) {
  log('exec => mup deploy');
}

export function help(api) {
  log('exec => mup help');
}

export function init(/* api */) {
  log('exec => mup init');

  // TODO check if mup.js or settings.json files exists
  const src = path.resolve(__dirname, 'template/*');
  const dst = process.cwd();
  sh.cp(src, dst);
}

export function logs(api) {
  log('exec => mup logs');
}

export function reconfig(api) {
  log('exec => mup reconfig');
}

export function restart(api) {
  log('exec => mup restart');
}

export function setup(api) {
  log('exec => mup setup');

  return Promise.all([
    meteor.setup(api),
    mongo.setup(api),
  ]);
}

export function start(api) {
  log('exec => mup start');
}

export function stop(api) {
  log('exec => mup stop');
}
