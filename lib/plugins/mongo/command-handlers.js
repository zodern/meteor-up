'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logs = logs;
exports.setup = setup;
exports.start = start;
exports.stop = stop;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:module:mongo');

function logs(api) {
  log('exec => mup mongo logs');

  var args = api.getArgs();
  var sessions = api.getSessions(['mongo']);
  args.shift(); // remove mongo from args sent to docker
  return api.getDockerLogs('mongodb', sessions, args);
}

function setup(api) {
  log('exec => mup mongo setup');

  if (!api.getConfig().mongo) {
    // could happen when running "mup mongo setup"
    console.log('Not setting up built-in mongodb since there is no mongo config');
    return;
  }

  var mongoSessions = api.getSessions(['mongo']);
  var meteorSessions = api.getSessions(['app']);

  if (meteorSessions.length !== 1) {
    console.log('To use mup built-in mongodb setup, you should have only one meteor app server. To have more app servers, use an external mongodb setup');
    return;
  } else if (mongoSessions[0]._host !== meteorSessions[0]._host) {
    console.log('To use mup built-in mongodb setup, you should have both meteor app and mongodb on the same server');
    return;
  }

  var list = _nodemiral2.default.taskList('Setup Mongo');

  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/mongo-setup.sh')
  });

  list.copy('Copying mongodb.conf', {
    src: api.resolvePath(__dirname, 'assets/mongodb.conf'),
    dest: '/opt/mongodb/mongodb.conf'
  });

  var sessions = api.getSessions(['mongo']);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function start(api) {
  log('exec => mup mongo start');

  var mongoSessions = api.getSessions(['mongo']);
  var meteorSessions = api.getSessions(['app']);
  var config = api.getConfig().mongo;

  if (meteorSessions.length !== 1 || mongoSessions[0]._host !== meteorSessions[0]._host) {
    log('Skipping mongodb start. Incompatible config');
    return;
  }

  var list = _nodemiral2.default.taskList('Start Mongo');

  list.executeScript('Start Mongo', {
    script: api.resolvePath(__dirname, 'assets/mongo-start.sh'),
    vars: {
      mongoVersion: config.version || '3.4.1',
      mongoDbDir: '/var/lib/mongodb'
    }
  });

  var sessions = api.getSessions(['mongo']);
  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function stop(api) {
  log('exec => mup mongo stop');
  var list = _nodemiral2.default.taskList('Stop Mongo');

  list.executeScript('stop mongo', {
    script: api.resolvePath(__dirname, 'assets/mongo-stop.sh')
  });

  var sessions = api.getSessions(['mongo']);
  return api.runTaskList(list, sessions, { verbose: api.verbose });
}
//# sourceMappingURL=command-handlers.js.map