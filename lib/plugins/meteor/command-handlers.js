'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.push = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var push = exports.push = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(api) {
    var config, appPath, buildOptions, bundlePath, rebuild, buildCached, list, prepareSupported, supportedScript, unsupportedScript, sessions;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            log('exec => mup meteor push');
            config = api.getConfig().app;

            if (!config) {
              console.error('error: no configs found for meteor');
              process.exit(1);
            }

            appPath = api.resolvePath(api.getBasePath(), config.path);
            buildOptions = config.buildOptions || {};

            buildOptions.buildLocation = buildOptions.buildLocation || tmpBuildPath(appPath, api);

            bundlePath = api.resolvePath(buildOptions.buildLocation, 'bundle.tar.gz');
            rebuild = true;


            if (api.getOptions()['cached-build']) {
              buildCached = _fs2.default.existsSync(bundlePath);

              if (!buildCached) {
                console.log('Unable to use previous build. It doesn\'t exist.');
              } else {
                rebuild = false;
                console.log('Not building app. Using build from previous deploy at');
                console.log(buildOptions.buildLocation);
              }
            }

            if (!rebuild) {
              _context.next = 13;
              break;
            }

            console.log('Building App Bundle Locally');
            _context.next = 13;
            return (0, _build2.default)(appPath, buildOptions, api.getVerbose(), api);

          case 13:
            list = _nodemiral2.default.taskList('Pushing Meteor App');


            list.copy('Pushing Meteor App Bundle to The Server', {
              src: bundlePath,
              dest: '/opt/' + config.name + '/tmp/bundle.tar.gz',
              progressBar: config.enableUploadProgressBar
            });

            prepareSupported = config.docker.image.indexOf('abernix/meteord') === 0;

            if ('prepareBundle' in config.docker) {
              prepareSupported = config.docker.prepareBundle;
            }

            supportedScript = api.resolvePath(__dirname, 'assets/prepare-bundle.sh');
            unsupportedScript = api.resolvePath(__dirname, 'assets/prepare-bundle-unsupported.sh');


            list.executeScript('Prepare Bundle', {
              script: prepareSupported ? supportedScript : unsupportedScript,
              vars: {
                appName: config.name,
                dockerImage: config.docker.image,
                env: config.env
              }
            });

            sessions = api.getSessions(['app']);
            return _context.abrupt('return', api.runTaskList(list, sessions, {
              series: true,
              verbose: api.verbose
            }));

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function push(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.logs = logs;
exports.setup = setup;
exports.envconfig = envconfig;
exports.start = start;
exports.deploy = deploy;
exports.stop = stop;
exports.restart = restart;

var _build = require('./build.js');

var _build2 = _interopRequireDefault(_build);

var _lodash = require('lodash');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _randomSeed = require('random-seed');

var _randomSeed2 = _interopRequireDefault(_randomSeed);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var log = (0, _debug2.default)('mup:module:meteor');

function tmpBuildPath(appPath, api) {
  var rand = _randomSeed2.default.create(appPath);
  var uuidNumbers = [];
  for (var i = 0; i < 16; i++) {
    uuidNumbers.push(rand(255));
  }
  return api.resolvePath(_os2.default.tmpdir(), 'mup-meteor-' + _uuid2.default.v4({ random: uuidNumbers }));
}

function logs(api) {
  log('exec => mup meteor logs');
  var config = api.getConfig().app;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  var args = api.getArgs();
  if (args[0] === 'meteor') {
    args.shift();
  }

  var sessions = api.getSessions(['app']);
  return api.getDockerLogs(config.name, sessions, args);
}

function setup(api) {
  log('exec => mup meteor setup');
  var config = api.getConfig().app;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  var list = _nodemiral2.default.taskList('Setup Meteor');

  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/meteor-setup.sh'),
    vars: {
      name: config.name
    }
  });

  if (config.ssl && _typeof(config.ssl.autogenerate) !== 'object') {
    var basePath = api.getBasePath();

    if (config.ssl.upload !== false) {
      list.executeScript('Cleaning up SSL Certificates', {
        script: api.resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
        vars: {
          name: config.name
        }
      });
      list.copy('Copying SSL Certificate Bundle', {
        src: api.resolvePath(basePath, config.ssl.crt),
        dest: '/opt/' + config.name + '/config/bundle.crt'
      });

      list.copy('Copying SSL Private Key', {
        src: api.resolvePath(basePath, config.ssl.key),
        dest: '/opt/' + config.name + '/config/private.key'
      });
    }

    list.executeScript('Verifying SSL Configurations', {
      script: api.resolvePath(__dirname, 'assets/verify-ssl-config.sh'),
      vars: {
        name: config.name
      }
    });
  }

  var sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function envconfig(api) {
  log('exec => mup meteor envconfig');

  var config = api.getConfig().app;
  var servers = api.getConfig().servers;
  var bindAddress = '0.0.0.0';

  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  config.log = config.log || {
    opts: {
      'max-size': '100m',
      'max-file': 10
    }
  };

  config.nginx = config.nginx || {};

  if (config.docker && config.docker.bind) {
    bindAddress = config.docker.bind;
  }

  if (config.dockerImageFrontendServer) {
    config.docker.imageFrontendServer = config.dockerImageFrontendServer;
  }
  if (!config.docker.imageFrontendServer) {
    config.docker.imageFrontendServer = 'meteorhacks/mup-frontend-server';
  }

  // If imagePort is not set, go with port 80 which was the traditional
  // port used by kadirahq/meteord and meteorhacks/meteord
  config.docker.imagePort = config.docker.imagePort || 80;

  if (config.ssl) {
    config.ssl.port = config.ssl.port || 443;
  }

  var list = _nodemiral2.default.taskList('Configuring App');

  if (config.nginx.configPath) {
    list.copy('Pushing the nginx config', {
      src: config.nginx.configPath,
      dest: '/opt/' + config.name + '/config/nginx-default.conf',
      progressBar: config.enableUploadProgressBar
    });
  }

  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: '/opt/' + config.name + '/config/start.sh',
    vars: {
      appName: config.name,
      port: config.env.PORT || 80,
      bind: bindAddress,
      sslConfig: config.ssl,
      logConfig: config.log,
      volumes: config.volumes,
      docker: config.docker,
      proxyConfig: api.getConfig().proxy,
      nginxClientUploadLimit: config.nginx.clientUploadLimit || '10M'
    }
  });

  var env = (0, _lodash.cloneDeep)(config.env);
  env.METEOR_SETTINGS = JSON.stringify(api.getSettings());
  // sending PORT to the docker container is useless.

  // setting PORT in the config is used for the publicly accessible
  // port.

  // docker.imagePort is used for the port exposed from the container.
  // In case the docker.imagePort is different than the container's
  // default port, we set the env PORT to docker.imagePort.
  env.PORT = config.docker.imagePort;

  var hostVars = {};
  Object.keys(config.servers).forEach(function (key) {
    if (config.servers[key].env) {
      hostVars[servers[key].host] = { env: config.servers[key].env };
    }
  });

  list.copy('Sending Environment Variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env.list',
    hostVars: hostVars,
    vars: {
      env: env || {},
      appName: config.name
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

function start(api) {
  log('exec => mup meteor start');
  var config = api.getConfig().app;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  var list = _nodemiral2.default.taskList('Start Meteor');

  list.executeScript('Start Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: config.name
    }
  });

  list.executeScript('Verifying Deployment', {
    script: api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh'),
    vars: {
      deployCheckWaitTime: config.deployCheckWaitTime || 60,
      appName: config.name,
      deployCheckPort: config.deployCheckPort || config.env.PORT || 80,
      deployCheckPath: '',
      host: api.getConfig().proxy ? api.getConfig().proxy.domains.split(',')[0] : null
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}

function deploy(api) {
  log('exec => mup meteor deploy');

  // validate settings and config before starting
  api.getSettings();
  var config = api.getConfig().app;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  return api.runCommand('meteor.push').then(function () {
    return api.runCommand('meteor.envconfig');
  }).then(function () {
    return api.runCommand('meteor.start');
  });
}

function stop(api) {
  log('exec => mup meteor stop');
  var config = api.getConfig().app;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  var list = _nodemiral2.default.taskList('Stop Meteor');

  list.executeScript('Stop Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function restart(api) {
  var list = _nodemiral2.default.taskList('Restart Meteor');
  var sessions = api.getSessions(['meteor']);
  var config = api.getConfig().app;

  list.executeScript('Stop Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  list.executeScript('Start Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: config.name
    }
  });

  list.executeScript('Verifying Deployment', {
    script: api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh'),
    vars: {
      deployCheckWaitTime: config.deployCheckWaitTime || 60,
      appName: config.name,
      deployCheckPort: config.deployCheckPort || config.env.PORT || 80,
      deployCheckPath: '',
      host: api.getConfig().proxy ? api.getConfig().proxy.domains.split(',')[0] : null
    }
  });

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  });
}
//# sourceMappingURL=command-handlers.js.map