import * as docker from '../docker/tasks';
import * as meteor from '../meteor/tasks';
import * as mongo from '../mongo/tasks';

import debug from 'debug';
import { resolvePath } from '../utils';
import sh from 'shelljs';
import fs from 'fs';
import { getConfig } from '../../mup-api';

const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy() {
  log('exec => mup deploy');
  return meteor.deploy();
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

export function logs() {
  log('exec => mup logs');
  return meteor.logs();
}

export function reconfig() {
  log('exec => mup reconfig');
  return meteor.envconfig().then(() => meteor.start());
}

export function restart() {
  log('exec => mup restart');
  return meteor.stop().then(() => meteor.start());
}

export function setup() {
  function displayNextSteps() {
    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  }

  log('exec => mup setup');
  const config = getConfig();
  return docker
    .setup()
    .then(meteor.setup)
    .then(() => {
      if (config.mongo) {
        return mongo.setup();
      }
    })
    .then(() => {
      if (config.mongo) {
        return mongo.start();
      }
    })
    .then(displayNextSteps);
}

export function start() {
  log('exec => mup start');
  return meteor.start();
}

export function stop() {
  log('exec => mup stop');
  return meteor.stop();
}
