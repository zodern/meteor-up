'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = exports.ssh = exports.stop = exports.start = exports.setup = exports.restart = exports.reconfig = exports.logs = exports.deploy = exports.init = undefined;

var _commandHandlers = require('./command-handlers');

var commandHandlers = _interopRequireWildcard(_commandHandlers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var init = exports.init = {
  description: 'Setup files for new mup project',
  handler: commandHandlers.init
};

var deploy = exports.deploy = {
  description: 'Deploy app to server',
  builder: function builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.deploy
};

var logs = exports.logs = {
  description: "Show app\'s logs. Supports options from docker logs",
  builder: function builder(yargs) {
    return yargs.strict(false).option('tail', {
      description: 'Number of lines to show from the end of the logs',
      number: true
    }).option('follow', {
      description: 'Follow log output',
      alias: 'f',
      boolean: true
    });
  },

  handler: commandHandlers.logs
};

var reconfig = exports.reconfig = {
  description: 'Updates server env and start script to match config',
  handler: commandHandlers.reconfig
};

var restart = exports.restart = {
  description: 'Restart app',
  handler: commandHandlers.restart
};

var setup = exports.setup = {
  description: 'Install dependencies, custom certificates, and MongoDB on server',
  handler: commandHandlers.setup
};

var start = exports.start = {
  description: 'Start app',
  handler: commandHandlers.start
};

var stop = exports.stop = {
  description: 'Stop app',
  handler: commandHandlers.stop
};

var ssh = exports.ssh = {
  name: 'ssh [server]',
  description: 'SSH into server',
  handler: commandHandlers.ssh
};

var validate = exports.validate = {
  description: 'validate config',
  builder: function builder(yargs) {
    return yargs.option('show', {
      description: 'Show config after being modified by plugins',
      bool: true
    }).option('scrub', {
      description: 'When used with --show, hides sensitive information',
      bool: true
    });
  },

  handler: commandHandlers.validate
};
//# sourceMappingURL=commands.js.map