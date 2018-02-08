import debug from 'debug';
import fs from 'fs';
import path from 'path';
import sh from 'shelljs';

const log = debug('mup:init');

sh.config.silent = true;

function findDestination(api) {
  const base = process.cwd();

  const inMeteorApp = fs.existsSync(api.resolvePath(base, '.meteor/release'));
  const parentMeteorApp = fs.existsSync(api.resolvePath(base, '../.meteor/release'));
  const parentChildren = fs.readdirSync(api.resolvePath(base, '../'));
  let siblingMeteorApp = false;
  let otherChild = '';

  if (parentChildren.length === 2) {
    otherChild = parentChildren
      .filter(child => child !== path.basename(base))[0];
    if (fs.existsSync(api.resolvePath('..', otherChild, '.meteor/release'))) {
      siblingMeteorApp = true;
    }
  }

  log('in meteor app', inMeteorApp);
  log('Parent Meteor app', parentMeteorApp);
  log('siblingMeteorApp', siblingMeteorApp);

  let dest = base;
  let appPath = './';
  let createFolder = false;

  if (inMeteorApp) {
    dest = api.resolvePath(base, '.deploy');
    appPath = '../';
    createFolder = true;
  } else if (parentMeteorApp) {
    dest = base;
    appPath = '../';
  } else if (siblingMeteorApp) {
    dest = base;
    appPath = `../${otherChild}`;
  }

  return {
    appPath,
    dest,
    createFolder
  };
}

function createDeployFolder(api) {
  const base = process.cwd();
  const folderPath = api.resolvePath(base, '.deploy');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
}

export default function init(api) {
  const configSource = api.resolvePath(__dirname, 'template/mup.js.sample');
  const settingsSource = api.resolvePath(__dirname, 'template/settings.json');

  const { appPath, dest, createFolder } = findDestination(api);

  const settingsDest = api.resolvePath(dest, 'settings.json');
  const configDest = api.resolvePath(dest, 'mup.js');

  const configExists = fs.existsSync(api.resolvePath(configDest));
  const settingsExist = fs.existsSync(settingsDest);

  if (createFolder) {
    createDeployFolder(api);
    console.log('Created .deploy folder');
  }

  if (!settingsExist) {
    sh.cp(settingsSource, settingsDest);
    console.log(`Created settings.json at ${settingsDest}`);
  } else {
    console.log('Skipping creation of settings.json.');
    console.log(`settings.json already exists at ${settingsDest}`);
  }

  if (!configExists) {
    const configContents = fs.readFileSync(configSource).toString()
      .replace('<app path>', appPath);
    fs.writeFileSync(configDest, configContents);

    console.log(`Created mup.js at ${configDest}`);
    console.log('');
    console.log('Next Steps:');
    console.log('');
    console.log('  Open mup.js and edit the config to meet your needs.');
    console.log('  Required changes have been marked with a TODO comment.');
    console.log('');
    console.log('  Available options can be found in the docs at');
    console.log('    https://github.com/zodern/meteor-up');
    console.log('');
    console.log('  Then, run the command:');
    console.log('    mup setup');
  } else {
    console.log('Skipping creation of mup.js');
    console.log(`mup.js already exists at ${configDest}`);
  }
}
