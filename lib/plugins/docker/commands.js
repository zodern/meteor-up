'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ps = exports.restart = exports.setup = undefined;

var _commandHandlers = require('./command-handlers');

var commandHandlers = _interopRequireWildcard(_commandHandlers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var setup = exports.setup = {
  description: 'Install and start docker',
  handler: commandHandlers.setup
};

var restart = exports.restart = {
  description: 'Restart docker daemon',
  handler: commandHandlers.restart
};

var ps = exports.ps = {
  description: 'View running containers. Accepts same options as docker ps',
  builder: function builder(_builder) {
    return _builder.strict(false);
  },

  handler: commandHandlers.ps
};
//# sourceMappingURL=commands.js.map