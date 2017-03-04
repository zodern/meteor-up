var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');

import { resolvePath } from '../utils';
var _ = require('underscore');

function buildApp(appPath, buildOptions) {
  // Check if the folder exists
  try {
    fs.statSync(resolvePath(appPath));
  } catch (e) {
    console.log(e);
    console.log(`${resolvePath(appPath)} does not exist`);
    process.exit(1);
  }
  // Make sure it is a Meteor app
  try {
    // checks for release file since there also is a
    // .meteor folder in the user's home
    fs.statSync(resolvePath(appPath, '.meteor/release'));
  } catch (e) {
    console.log(`${resolvePath(appPath)} is not a meteor app`);
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const callback = err => {
      if (err) {
        return reject(err);
      }
      resolve();
    };
    buildMeteorApp(appPath, buildOptions, function(code) {
      if (code === 0) {
        archiveIt(buildOptions.buildLocation, callback);
        return;
      }
      console.log('\n=> Build Error. Check the logs printed above.');
      callback(new Error('build-error'));
    });
  });
}

function buildMeteorApp(appPath, buildOptions, callback) {
  var executable = buildOptions.executable || 'meteor';
  var args = [
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
    args.push(appPath + '/settings.json');
  }

  if (buildOptions.server) {
    args.push('--server');
    args.push(buildOptions.server);
  }

  if (buildOptions.allowIncompatibleUpdate) {
    args.push('--allow-incompatible-update');
  }

  var isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || 'cmd.exe';
    args = ['/c', 'meteor'].concat(args);
  }

  var options = { cwd: appPath };
  var meteor = spawn(executable, args, options);

  meteor.stdout.pipe(process.stdout, { end: false });
  meteor.stderr.pipe(process.stderr, { end: false });

  meteor.on('error', e => {
    console.log(options);
    console.log(e);
  });
  meteor.on('close', callback);
}

function archiveIt(buildLocation, cb) {
  var callback = _.once(cb);
  var bundlePath = resolvePath(buildLocation, 'bundle.tar.gz');
  var sourceDir = resolvePath(buildLocation, 'bundle');

  var output = fs.createWriteStream(bundlePath);
  var archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 9
    }
  });

  archive.pipe(output);
  output.once('close', callback);

  archive.once('error', function(err) {
    console.log('=> Archiving failed:', err.message);
    callback(err);
  });

  archive.directory(sourceDir, 'bundle').finalize();
}

module.exports = buildApp;
