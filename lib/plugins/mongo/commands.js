'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stop = exports.start = exports.logs = exports.setup = undefined;

var _commandHandlers = require('./command-handlers');

var commandHandlers = _interopRequireWildcard(_commandHandlers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var setup = exports.setup = {
  description: 'Installs and starts MongoDB',
  handler: commandHandlers.setup
};

var logs = exports.logs = {
  description: 'View MongoDB logs',
  builder: function builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.logs
};

var start = exports.start = {
  description: 'Start MongoDB',
  handler: commandHandlers.start
};

var stop = exports.stop = {
  description: 'Stop MongoDB',
  handler: commandHandlers.stop
};
//# sourceMappingURL=commands.js.map