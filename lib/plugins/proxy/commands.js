'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stop = exports.start = exports.envconfig = exports.leLogs = exports.logs = exports.reconfigShared = exports.setup = undefined;

var _commandHandlers = require('./command-handlers');

var commandHandlers = _interopRequireWildcard(_commandHandlers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var setup = exports.setup = {
  description: 'Setup and start proxy',
  handler: commandHandlers.setup
};

var reconfigShared = exports.reconfigShared = {
  name: 'reconfig-shared',
  description: 'Reconfigure shared properties',
  handler: commandHandlers.reconfigShared
};

var logs = exports.logs = {
  description: 'View logs for proxy',
  builder: function builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.logs
};

var leLogs = exports.leLogs = {
  name: 'logs-le',
  description: 'View logs for Let\'s Encrypt',
  builder: function builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.leLogs
};

var envconfig = exports.envconfig = {
  description: 'Configure environment variables for proxy',
  handler: commandHandlers.envconfig
};

var start = exports.start = {
  description: 'Start proxy and let\'s encrypt containers',
  handler: commandHandlers.start
};

var stop = exports.stop = {
  description: 'Stop proxy',
  handler: commandHandlers.stop
};
//# sourceMappingURL=commands.js.map