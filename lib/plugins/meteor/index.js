'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hooks = exports.validate = exports.commands = exports.description = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.prepareConfig = prepareConfig;

var _commands2 = require('./commands');

var _commands = _interopRequireWildcard(_commands2);

var _validate = require('./validate');

var _validate2 = _interopRequireDefault(_validate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var description = exports.description = 'Deploy and manage meteor apps';

var commands = exports.commands = _commands;

var validate = exports.validate = {
  meteor: _validate2.default,
  app: function app(config, utils) {
    if (_typeof(config.meteor) === 'object') {
      // The meteor validator will check the config
      return [];
    }
    return (0, _validate2.default)(config, utils);
  }
};

function prepareConfig(config) {
  if (!config.app) {
    return config;
  }

  config.app.docker = config.app.docker || {};
  config.app.docker.image = config.app.docker.image || config.app.dockerImage || 'kadirahq/meteord';
  delete config.app.dockerImage;
  return config;
}

var hooks = exports.hooks = {
  'post.default.setup': function postDefaultSetup(api) {
    var config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runCommand('meteor.setup');
    }
  },
  'post.default.deploy': function postDefaultDeploy(api) {
    var config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runCommand('meteor.deploy');
    }
  }
};
//# sourceMappingURL=index.js.map