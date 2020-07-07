import debug from 'debug';
import fs from 'fs';
import { spawn } from 'child_process';
import tar from 'tar';

const log = debug('mup:module:meteor');

export default function buildApp(appPath, buildOptions, verbose, api) {
  // Check if the folder exists
  try {
    fs.statSync(api.resolvePath(appPath));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`${api.resolvePath(appPath)} does not exist`);
    } else {
      console.log(e);
    }

    process.exit(1);
  }

  // Make sure it is a Meteor app
  try {
    // checks for release file since there also is a
    // .meteor folder in the user's home
    fs.statSync(api.resolvePath(appPath, '.meteor/release'));
  } catch (e) {
    console.log(`${api.resolvePath(appPath)} is not a meteor app`);
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const callback = err => {
      if (err) {
        reject(err);

        return;
      }
      resolve();
    };
    buildMeteorApp(appPath, buildOptions, verbose, code => {
      if (code === 0) {
        callback();

        return;
      }
      console.log('\n=> Build Error. Check the logs printed above.');
      process.exit(1);
    });
  });
}

function buildMeteorApp(appPath, buildOptions, verbose, callback) {
  let executable = buildOptions.executable || 'meteor';
  let args = [
    'build',
    '--directory',
    buildOptions.buildLocation,
    '--architecture',
    'os.linux.x86_64'
  ];

  if (buildOptions.debug) {
    args.push('--debug');
  }

  if (buildOptions.mobileSettings) {
    args.push('--mobile-settings');
    args.push(JSON.stringify(buildOptions.mobileSettings));
  }

  if (buildOptions.serverOnly) {
    args.push('--server-only');
  } else if (!buildOptions.mobileSettings) {
    args.push('--mobile-settings');
    args.push(`${appPath}/settings.json`);
  }

  if (buildOptions.server) {
    args.push('--server');
    args.push(buildOptions.server);
  }

  if (buildOptions.allowIncompatibleUpdate) {
    args.push('--allow-incompatible-update');
  }

  const isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    args = ['/c', executable].concat(args);
    executable = process.env.comspec || 'cmd.exe';
  }

  const options = {
    cwd: appPath,
    env: {
      ...process.env,
      METEOR_HEADLESS: 1
    },
    stdio: [process.stdin, process.stdout, process.stderr]
  };

  log(`Build Path: ${appPath}`);
  log(`Build Command:  ${executable} ${args.join(' ')}`);

  const meteor = spawn(executable, args, options);

  meteor.on('error', e => {
    console.log(options);
    console.log(e);
    console.log('This error usually happens when meteor is not installed.');
  });
  meteor.on('close', callback);
}

export function archiveApp(buildLocation, api, cb) {
  const bundlePath = api.resolvePath(buildLocation, 'bundle.tar.gz');

  log('starting archive');
  tar.c({
    file: bundlePath,
    onwarn(message, data) { console.log(message, data); },
    cwd: buildLocation,
    portable: true,
    gzip: {
      level: 9
    }
  }, ['bundle'], err => {
    log('archive finished');

    if (err) {
      console.log('=> Archiving failed: ', err.message);
    }

    cb(err);
  });
}
