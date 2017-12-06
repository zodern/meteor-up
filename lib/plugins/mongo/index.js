'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hooks = exports.validate = exports.commands = exports.description = undefined;
exports.prepareConfig = prepareConfig;

var _commands2 = require('./commands');

var _commands = _interopRequireWildcard(_commands2);

var _validate = require('./validate');

var _validate2 = _interopRequireDefault(_validate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var description = exports.description = 'Commands to manage MongoDB';
var commands = exports.commands = _commands;
var validate = exports.validate = {
  mongo: _validate2.default
};

function prepareConfig(config) {
  if (!config.app || !config.mongo) {
    return config;
  }

  config.app.env = config.app.env || {};
  config.app.env['MONGO_URL'] = 'mongodb://mongodb:27017/' + config.app.name.split('.').join('');

  if (!config.app.docker) {
    config.app.docker = {};
  }

  if (!config.app.docker.args) {
    config.app.docker.args = [];
  }

  config.app.docker.args.push('--link=mongodb:mongodb');
  return config;
}

var hooks = exports.hooks = {
  'post.default.setup': function postDefaultSetup(api) {
    var config = api.getConfig();
    if (config.mongo) {
      return api.runCommand('mongo.setup').then(function () {
        return api.runCommand('mongo.start');
      });
    }
  }
};
//# sourceMappingURL=index.js.map