'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = buildApp;
exports.archiveApp = archiveApp;

var _tar = require('tar');

var _tar2 = _interopRequireDefault(_tar);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:module:meteor');

function buildApp(appPath, buildOptions, verbose, api) {
  // Check if the folder exists
  try {
    _fs2.default.statSync(api.resolvePath(appPath));
  } catch (e) {

    if (e.code === 'ENOENT') {
      console.log(api.resolvePath(appPath) + ' does not exist');
    } else {
      console.log(e);
    }

    process.exit(1);
  }

  // Make sure it is a Meteor app
  try {
    // checks for release file since there also is a
    // .meteor folder in the user's home
    _fs2.default.statSync(api.resolvePath(appPath, '.meteor/release'));
  } catch (e) {
    console.log(api.resolvePath(appPath) + ' is not a meteor app');
    process.exit(1);
  }

  return new Promise(function (resolve, reject) {
    var callback = function callback(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    };
    buildMeteorApp(appPath, buildOptions, verbose, function (code) {
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
  var executable = buildOptions.executable || 'meteor';
  var args = ['build', '--directory', buildOptions.buildLocation, '--architecture', 'os.linux.x86_64'];

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

  var options = {
    cwd: appPath,
    env: _extends({}, process.env, {
      METEOR_HEADLESS: 1
    }),
    stdio: verbose ? 'inherit' : 'pipe'
  };

  log('Build Path: ' + appPath);
  log('Build Command:  ' + executable + ' ' + args.join(' '));

  var meteor = (0, _child_process.spawn)(executable, args, options);

  if (!verbose) {
    meteor.stdout.pipe(process.stdout, { end: false });
    meteor.stderr.pipe(process.stderr, { end: false });
  }

  meteor.on('error', function (e) {
    console.log(options);
    console.log(e);
    console.log('This error usually happens when meteor is not installed.');
  });
  meteor.on('close', callback);
}

function archiveApp(buildLocation, api, cb) {
  var bundlePath = api.resolvePath(buildLocation, 'bundle.tar.gz');

  log('starting archive');
  _tar2.default.c({
    file: bundlePath,
    onwarn: function onwarn(message, data) {
      console.log(message, data);
    },

    cwd: buildLocation,
    portable: true,
    gzip: {
      level: 9
    }
  }, ['bundle'], function (err) {
    log('archive finished');

    if (err) {
      console.log('=> Archiving failed: ', err.message);
    }

    cb(err);
  });
}
//# sourceMappingURL=build.js.map