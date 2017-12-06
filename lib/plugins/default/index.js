'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commands = undefined;
exports.scrubConfig = scrubConfig;

var _commands2 = require('./commands');

var _commands = _interopRequireWildcard(_commands2);

var _traverse = require('traverse');

var _traverse2 = _interopRequireDefault(_traverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var commands = exports.commands = _commands;

function scrubConfig(config) {
  if (config.servers) {
    config.servers = (0, _traverse2.default)(config.servers).map(function () {
      if (this.path.length !== 2) {
        return;
      }

      switch (this.key) {
        case 'host':
          return this.update('1.2.3.4');
        case 'password':
          return this.update('password');
        case 'pem':
          return this.update('~/.ssh/pem');
      }
    });
  }

  return config;
}
//# sourceMappingURL=index.js.map