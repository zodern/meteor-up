'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = exports.commands = exports.description = undefined;
exports.prepareConfig = prepareConfig;

var _commands2 = require('./commands');

var _commands = _interopRequireWildcard(_commands2);

var _validate = require('./validate');

var _validate2 = _interopRequireDefault(_validate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var description = exports.description = 'Setup and manage reverse proxy and ssl';

var commands = exports.commands = _commands;

var validate = exports.validate = {
  proxy: _validate2.default
};

function prepareConfig(config) {
  if (!config.app || !config.proxy) {
    return config;
  }

  config.app.env = config.app.env || {};

  config.app.env['VIRTUAL_HOST'] = config.proxy.domains;
  config.app.env['HTTPS_METHOD'] = config.proxy.ssl && config.proxy.ssl.forceSSL ? 'redirect' : 'noredirect';

  if (config.proxy.ssl && config.proxy.ssl.letsEncryptEmail) {
    config.app.env['LETSENCRYPT_HOST'] = config.proxy.domains;
    config.app.env['LETSENCRYPT_EMAIL'] = config.proxy.ssl.letsEncryptEmail;
  }

  return config;
}
//# sourceMappingURL=index.js.map