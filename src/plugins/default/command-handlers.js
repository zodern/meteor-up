import debug from 'debug';
import sh from 'shelljs';
import fs from 'fs';

const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy() {
  log('exec => mup deploy');
}

export function init(api) {
  log('exec => mup init');

  const mupJs = api.resolvePath(__dirname, 'template/mup.js.sample');
  const settinsJson = api.resolvePath(__dirname, 'template/settings.json');
  const mupJsDst = api.resolvePath(process.cwd(), 'mup.js');

  const settingsJsonDst = api.resolvePath(process.cwd(), 'settings.json');
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
  return api.runCommand('meteor.logs');
}

export function reconfig(api) {
  log('exec => mup reconfig');
  return api.runCommand('meteor.envconfig').then(() => api.runCommand('meteor.start'));
}

export function restart(api) {
  log('exec => mup restart');
  return api.runCommand('meteor.stop').then(() => api.runCommand('meteor.start'));
}

export function setup(api) {
  process.on('exit', function displayNextSteps(code) {
    if (code > 0) {
      return;
    }

    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  });

  log('exec => mup setup');
  const config = api.getConfig();
  return api.runCommand('docker.setup')
    .then(() => {
      if (config.proxy) {
        return api.runCommand('proxy.setup');
      }
    });
}

export function start(api) {
  log('exec => mup start');
  return api.runCommand('meteor.start');
}

export function stop(api) {
  log('exec => mup stop');
  return api.runCommand('meteor.stop');
}
