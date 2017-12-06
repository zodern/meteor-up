'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;
exports.restart = restart;
exports.ps = ps;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _async = require('async');

var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:module:docker');

function uniqueSessions(api) {
  var sessions = api.getSessions(['app', 'mongo', 'proxy']);
  return sessions.reduce(function (prev, curr) {
    if (prev.map(function (session) {
      return session._host;
    }).indexOf(curr._host) === -1) {
      prev.push(curr);
    }
    return prev;
  }, []);
}

function setup(api) {
  log('exec => mup docker setup');
  var list = _nodemiral2.default.taskList('Setup Docker');

  list.executeScript('Setup Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-setup.sh')
  });

  var sessions = uniqueSessions(api);

  if (sessions.length === 0) {
    // There are no servers, so we can skip running the list
    return;
  }

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function restart(api) {
  var list = _nodemiral2.default.taskList('Restart Docker Daemon');

  list.executeScript('Restart Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-restart.sh')
  });

  var sessions = uniqueSessions(api);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

function ps(api) {
  var args = api.getArgs();
  args.shift();
  (0, _async.each)(uniqueSessions(api), function (session, cb) {
    session.execute('sudo docker ' + args.join(' ') + ' 2>&1', function (err, code, logs) {
      console.log(_chalk2.default.magenta('[' + session._host + ']') + _chalk2.default.blue(' docker ' + args.join(' ')));
      console.log(logs.stdout);
      cb();
    });
  });
}
//# sourceMappingURL=command-handlers.js.map