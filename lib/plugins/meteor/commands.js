'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.envconfig = exports.push = exports.restart = exports.stop = exports.start = exports.logs = exports.deploy = exports.setup = undefined;

var _commandHandlers = require('./command-handlers');

var commandHandlers = _interopRequireWildcard(_commandHandlers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var setup = exports.setup = {
  description: 'Prepare server to deploy meteor apps',
  handler: commandHandlers.setup
};

var deploy = exports.deploy = {
  description: 'Deploy meteor apps',
  builder: function builder(subYargs) {
    return subYargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.deploy
};

var logs = exports.logs = {
  description: 'View meteor app\'s logs',
  builder: function builder(yargs) {
    return yargs.strict(false).option('tail', {
      description: 'Number of lines to show from the end of the logs',
      alias: 't',
      number: true
    }).option('follow', {
      description: 'Follow log output',
      alias: 'f',
      boolean: true
    });
  },

  handler: commandHandlers.logs
};

var start = exports.start = {
  description: 'Start meteor app',
  handler: commandHandlers.start
};

var stop = exports.stop = {
  description: 'Stop meteor app',
  handler: commandHandlers.stop
};

var restart = exports.restart = {
  description: 'Restart meteor app',
  handler: commandHandlers.restart
};

// Hidden commands
var push = exports.push = {
  description: false,
  builder: function builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.push
};

var envconfig = exports.envconfig = {
  description: false,
  handler: commandHandlers.envconfig
};
//# sourceMappingURL=commands.js.map