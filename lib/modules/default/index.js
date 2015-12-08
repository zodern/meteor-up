import path from 'path';
import sh from 'shelljs';
import * as meteor from '../meteor/';
import * as mongo from '../mongo/';

sh.config.silent = true;

// export function deploy(api) {
//
// }

// export function help(api) {
//
// }

export function init(/* api */) {
  // TODO check if mup.js or settings.json files exists
  const src = path.resolve(__dirname, 'template/*');
  const dst = process.cwd();
  sh.cp(src, dst);
}

// export function logs(api) {
//
// }

// export function reconfig(api) {
//
// }

// export function restart(api) {
//
// }

export function setup(api) {
  return Promise.all([
    meteor.setup(api),
    mongo.setup(api),
  ]);
}

// export function start(api) {
//
// }

// export function stop(api) {
//
// }
