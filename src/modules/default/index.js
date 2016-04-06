import path from 'path';
import debug from 'debug';
import sh from 'shelljs';
import * as meteor from '../meteor/';
import * as mongo from '../mongo/';
import * as docker from '../docker/';
const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy(api) {
  log('exec => mup deploy');
  return meteor.deploy(api);
}

export function help(api) {
  log('exec => mup help');
}
export function init(/* api */) {
  log('exec => mup init');

  // TODO check if mup.js or settings.json files exists
  const mupJs = path.resolve(__dirname, 'template/mup.js.sample');
  const settinsJson = path.resolve(__dirname, 'template/settings.json');
  const mupJsDst = path.resolve(process.cwd(), 'mup.js');
  const settingsJsonDst = path.resolve(process.cwd(), 'settings.json');

  sh.cp(mupJs, mupJsDst);
  sh.cp(settinsJson, settingsJsonDst);
}

export function logs(api) {
  log('exec => mup logs');
  return meteor.logs(api);
}

export function reconfig(api) {
  log('exec => mup reconfig');
  return meteor.envconfig(api)
    .then(() => meteor.start(api));
}

export function restart(api) {
  log('exec => mup restart');
  return meteor.stop(api)
    .then(() => meteor.start(api));
}

export function setup(api) {
  log('exec => mup setup');
  const config = api.getConfig();
  return docker.setup(api)
    .then(() => {
      if (config.mongo) {
        return Promise.all([
          meteor.setup(api),
          mongo.setup(api)
        ])
          .then(() => (mongo.start(api)));
      }
      return meteor.setup(api);
    });
}

export function start(api) {
  log('exec => mup start');
  return meteor.start(api);
}

export function stop(api) {
  log('exec => mup stop');
  return meteor.stop(api);
}
