'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logs = logs;
exports.leLogs = leLogs;
exports.setup = setup;
exports.reconfigShared = reconfigShared;
exports.start = start;
exports.stop = stop;

var _lodash = require('lodash');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:module:proxy');
var PROXY_CONTAINER_NAME = 'mup-nginx-proxy';

function logs(api) {
  log('exec => mup proxy logs');
  var config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  var args = api.getArgs().slice(1);
  var sessions = api.getSessions(['app']);
  return api.getDockerLogs(PROXY_CONTAINER_NAME, sessions, args);
}

function leLogs(api) {
  log('exec => mup proxy le-logs');
  var config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  var args = api.getArgs().slice(1);
  args[0] = 'logs';
  var sessions = api.getSessions(['app']);

  return api.getDockerLogs(PROXY_CONTAINER_NAME + '-letsencrypt', sessions, args);
}

function setup(api) {
  log('exec => mup proxy setup');
  var config = api.getConfig().proxy;
  var appName = api.getConfig().app.name;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  var list = _nodemiral2.default.taskList('Setup proxy');

  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/proxy-setup.sh'),
    vars: {
      name: PROXY_CONTAINER_NAME
    }
  });

  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/start.sh',
    vars: {
      appName: PROXY_CONTAINER_NAME,
      letsEncryptEmail: config.ssl ? config.ssl.letsEncryptEmail : null
    }
  });

  list.executeScript('Cleaning Up SSL Certificates', {
    script: api.resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
    vars: {
      name: appName,
      proxyName: PROXY_CONTAINER_NAME
    }
  });

  if (config.ssl && !config.ssl.letsEncryptEmail && config.ssl.upload !== false && config.ssl.crt) {
    list.copy('Copying SSL Certificate Bundle', {
      src: api.resolvePath(api.getBasePath(), config.ssl.crt),
      dest: '/opt/' + appName + '/config/bundle.crt'
    });
    list.copy('Copying SSL Private Key', {
      src: api.resolvePath(api.getBasePath(), config.ssl.key),
      dest: '/opt/' + appName + '/config/private.key'
    });
    list.executeScript('Setup SSL Certificates for Domains', {
      script: api.resolvePath(__dirname, 'assets/ssl-setup.sh'),
      vars: {
        appName: appName,
        proxyName: PROXY_CONTAINER_NAME,
        domains: config.domains.split(',')
      }
    });
  }

  var sessions = api.getSessions(['app']);

  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  }).then(function () {
    return api.runCommand('proxy.start');
  });
}

function reconfigShared(api) {
  var config = api.getConfig().proxy;
  var shared = config.shared || {};

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  console.log('The shared settings affect all apps using this reverse proxy.');

  if (Object.keys(shared).length === 0) {
    console.log('No shared config properties are set. Resetting proxy to defaults.');
  }

  var list = _nodemiral2.default.taskList('Configuring Proxy\'s Shared Settings');

  list.copy('Sending shared variables', {
    src: api.resolvePath(__dirname, 'assets/templates/shared-config.sh'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/shared-config.sh',
    vars: {
      httpPort: shared.httpPort,
      httpsPort: shared.httpsPort,
      clientUploadLimit: shared.clientUploadLimit
    }
  });

  var env = (0, _lodash.clone)(shared.env);

  list.copy('Sending proxy environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env.list',
    vars: {
      env: env || {}
    }
  });

  var envLetsEncrypt = (0, _lodash.clone)(shared.envLetsEncrypt);

  list.copy('Sending let\'s encrypt environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + PROXY_CONTAINER_NAME + '/config/env_letsencrypt.list',
    vars: {
      env: envLetsEncrypt || {}
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  }).then(function () {
    return api.runCommand('proxy.start');
  });
}

function start(api) {
  log('exec => mup proxy start');
  var config = api.getConfig().proxy;
  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  var list = _nodemiral2.default.taskList('Start proxy');

  list.executeScript('Start proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-start.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

function stop(api) {
  log('exec => mup proxy stop');

  var list = _nodemiral2.default.taskList('Stop proxy');

  list.executeScript('Stop proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-stop.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });

  var sessions = api.getSessions(['app']);
  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}
//# sourceMappingURL=command-handlers.js.map