import * as docker from '../docker/';
import * as meteor from '../meteor/';
import * as mongo from '../mongo/';
import * as proxy from '../proxy/';

import debug from 'debug';
import { resolvePath } from '../utils';
import sh from 'shelljs';
import fs from 'fs';

const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy(api) {
  log('exec => mup deploy');
  return meteor.deploy(api);
}

export function help() {
  log('exec => mup help');
}
export function init() {
  log('exec => mup init');

  const mupJs = resolvePath(__dirname, 'template/mup.js.sample');
  const settinsJson = resolvePath(__dirname, 'template/settings.json');
  const mupJsDst = resolvePath(process.cwd(), 'mup.js');
  const settingsJsonDst = resolvePath(process.cwd(), 'settings.json');
  const mupJsExists = fs.existsSync(mupJsDst);
  const settingsJsonExist = fs.existsSync(settingsJsonDst);

  if (!settingsJsonExist) {
    sh.cp(settinsJson, settingsJsonDst);
    console.log('Created settings.json');
  } else {
    console.log('Skipping creation of settings.json.');
    console.log(`settings.json already exist at ${settingsJsonDst}.`);
  }

  if (!mupJsExists) {
    sh.cp(mupJs, mupJsDst);

    console.log('Created mup.js');
    console.log('');
    console.log('Next Steps:');
    console.log('');
    console.log('  Open mup.js and edit the config to meet your needs.');
    console.log('  Required changes have been marked with a TODO comment.');
    console.log('');
    console.log('  Available options can be found in the docs at');
    console.log('    https://github.com/zodern/meteor-up');
    console.log('');
    console.log('  Then run the command:');
    console.log('    mup setup');
  } else {
    console.log('Skipping creation of mup.js');
    console.log(`mup.js already exists at ${mupJsDst}`);
  }
}

export function logs(api) {
  log('exec => mup logs');
  return meteor.logs(api);
}

export function reconfig(api) {
  log('exec => mup reconfig');
  return meteor.envconfig(api).then(() => meteor.start(api));
}

export function restart(api) {
  log('exec => mup restart');
  return meteor.stop(api).then(() => meteor.start(api));
}

export function setup(api) {
  function displayNextSteps() {
    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  }

  log('exec => mup setup');
  const config = api.getConfig();
  return docker
    .setup(api)
    .then(meteor.setup.bind(null, api))
    .then(() => {
      if (config.mongo) {
        return mongo.setup(api);
      }
    })
    .then(() => {
      if (config.mongo) {
        return mongo.start(api);
      }
    })
    .then(() => {
      if (config.proxy) {
        return proxy.setup(api);
      }
    })
    .then(displayNextSteps);
}

export function start(api) {
  log('exec => mup start');
  return meteor.start(api);
}

export function stop(api) {
  log('exec => mup stop');
  return meteor.stop(api);
}
