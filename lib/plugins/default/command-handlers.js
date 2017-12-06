'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deploy = deploy;
exports.init = init;
exports.logs = logs;
exports.reconfig = reconfig;
exports.restart = restart;
exports.setup = setup;
exports.start = start;
exports.stop = stop;
exports.ssh = ssh;
exports.validate = validate;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _ssh = require('ssh2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:module:default');

_shelljs2.default.config.silent = true;

function deploy() {
  log('exec => mup deploy');
}

function init(api) {
  log('exec => mup init');

  var mupJs = api.resolvePath(__dirname, 'template/mup.js.sample');
  var settinsJson = api.resolvePath(__dirname, 'template/settings.json');
  var mupJsDst = api.resolvePath(process.cwd(), 'mup.js');

  var settingsJsonDst = api.resolvePath(process.cwd(), 'settings.json');
  var mupJsExists = _fs2.default.existsSync(mupJsDst);
  var settingsJsonExist = _fs2.default.existsSync(settingsJsonDst);

  if (!settingsJsonExist) {
    _shelljs2.default.cp(settinsJson, settingsJsonDst);
    console.log('Created settings.json');
  } else {
    console.log('Skipping creation of settings.json.');
    console.log('settings.json already exist at ' + settingsJsonDst + '.');
  }

  if (!mupJsExists) {
    _shelljs2.default.cp(mupJs, mupJsDst);

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
    console.log('  Then, run the command:');
    console.log('    mup setup');
  } else {
    console.log('Skipping creation of mup.js');
    console.log('mup.js already exists at ' + mupJsDst);
  }
}

function logs() {
  log('exec => mup logs');
}

function reconfig() {
  log('exec => mup reconfig');
}

function restart() {
  log('exec => mup restart');
}

function setup(api) {
  process.on('exit', function displayNextSteps(code) {
    if (code > 0) {
      return;
    }

    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  });

  log('exec => mup setup');
  var config = api.getConfig();
  return api.runCommand('docker.setup').then(function () {
    if (config.proxy) {
      return api.runCommand('proxy.setup');
    }
  });
}

function start() {
  log('exec => mup start');
}

function stop() {
  log('exec => mup stop');
}

function ssh(api) {
  var servers = api.getConfig().servers;
  var serverOption = api.getArgs()[1];

  if (!(serverOption in servers)) {
    console.log('mup ssh <server>');
    console.log('Available servers are:\n', Object.keys(servers).join('\n'));
    process.exitCode = 1;
    return;
  }

  var server = servers[serverOption];
  var sshOptions = api._createSSHOptions(server);

  var conn = new _ssh.Client();
  conn.on('ready', function () {
    conn.shell(function (err, stream) {
      if (err) {
        throw err;
      }
      stream.on('close', function () {
        conn.end();
        process.exit();
      });

      process.stdin.setRawMode(true);
      process.stdin.pipe(stream);

      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      stream.setWindow(process.stdout.rows, process.stdout.columns);

      process.stdout.on('resize', function () {
        stream.setWindow(process.stdout.rows, process.stdout.columns);
      });
    });
  }).connect(sshOptions);
}

function validate(api) {
  // Shows validation errors
  api.getConfig();

  if (api.getOptions()['show']) {
    var config = api.getConfig();
    if (api.getOptions()['scrub']) {
      config = api.scrubConfig();
    }
    console.log(JSON.stringify(config, null, 2));
  }

  var errors = api.validateConfig('');
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}
//# sourceMappingURL=command-handlers.js.map