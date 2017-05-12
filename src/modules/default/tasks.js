import * as docker from '../docker/tasks';
import * as meteor from '../meteor/tasks';
import * as mongo from '../mongo/tasks';

import debug from 'debug';
import { resolvePath } from '../utils';
import sh from 'shelljs';
import fs from 'fs';

const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy(api) {
  log('exec => mup deploy');
  api.runTask('meteor.deploy');
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
  return api.runTask('meteor.logs');
}

export function reconfig(api) {
  log('exec => mup reconfig');
  return api.runTask('meteor.envconfig').then(() => api.runTask('meteor.start'));
}

export function restart(api) {
  log('exec => mup restart');
  return api.runTask('meteor.stop').then(() => api.runTask('meteor.start'));
}

export function setup(api) {
  function displayNextSteps() {
    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  }

  log('exec => mup setup');
  const config = api.getConfig();
  return api.runTask('docker.setup')
    .then(() => api.runTask('meteor.setup'))
    .then(() => {
      if (config.mongo) {
        api.runTask('mongo.setup');
      }
    })
    .then(() => {
      if (config.mongo) {
        return api.runTask('mongo.start');
      }
    })
    .then(displayNextSteps);
}

export function start(api) {
  log('exec => mup start');
  return api.runTask('meteor.start');
}

export function stop(api) {
  log('exec => mup stop');
  return api.runTask('meteor.stop');
}
