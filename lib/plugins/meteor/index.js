'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hooks = exports.validate = exports.commands = exports.description = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.prepareConfig = prepareConfig;
exports.scrubConfig = scrubConfig;

var _commands2 = require('./commands');

var _commands = _interopRequireWildcard(_commands2);

var _validate = require('./validate');

var _validate2 = _interopRequireDefault(_validate);

var _traverse = require('traverse');

var _traverse2 = _interopRequireDefault(_traverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var description = exports.description = 'Deploy and manage meteor apps';

var commands = exports.commands = _commands;

var validate = exports.validate = {
  meteor: _validate2.default,
  app: function app(config, utils) {
    if (_typeof(config.meteor) === 'object' || config.app && config.app.type !== 'meteor') {
      // The meteor validator will check the config
      // Or the config is telling a different app to handle deployment
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

function meteorEnabled(api) {
  var config = api.getConfig();
  if (config.app && config.app.type === 'meteor') {
    return true;
  }
  return false;
}

var hooks = exports.hooks = {
  'post.default.setup': function postDefaultSetup(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.setup');
    }
  },
  'post.default.deploy': function postDefaultDeploy(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.deploy');
    }
  },
  'post.default.start': function postDefaultStart(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.start');
    }
  },
  'post.default.stop': function postDefaultStop(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.stop');
    }
  },
  'post.default.logs': function postDefaultLogs(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.logs');
    }
  },
  'post.default.reconfig': function postDefaultReconfig(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.envconfig').then(function () {
        return api.runCommand('meteor.start');
      });
    }
  },
  'post.default.restart': function postDefaultRestart(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.restart');
    }
  }
};

function scrubConfig(config, utils) {
  if (config.meteor) {
    delete config.meteor;
  }

  if (config.app) {
    config.app = (0, _traverse2.default)(config.app).map(function () {
      var path = this.path.join('.');

      switch (path) {
        case 'name':
          return this.update('my-app');
        case 'buildOptions.server':
          return this.update(utils.scrubUrl(this.node));

        case 'env.ROOT_URL':
          return this.update(utils.scrubUrl(this.node));

        case 'env.MONGO_URL':
          if (config.mongo) {
            var url = this.node.split('/');
            url.pop();
            url.push('my-app');

            return this.update(url.join('/'));
          }

          return this.update(utils.scrubUrl(this.node));
      }
    });
  }

  return config;
}
//# sourceMappingURL=index.js.map