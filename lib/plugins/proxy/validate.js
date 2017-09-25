'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (config, _ref) {
  var combineErrorDetails = _ref.combineErrorDetails,
      VALIDATE_OPTIONS = _ref.VALIDATE_OPTIONS,
      addLocation = _ref.addLocation;

  var details = [];
  details = combineErrorDetails(details, _joi2.default.validate(config.proxy, schema, VALIDATE_OPTIONS));
  if (config.app && config.app.env && typeof config.app.env.PORT === 'number' && config.app.env.PORT !== 80) {
    details.push({
      message: 'app.env.PORT can not be set when using proxy',
      path: ''
    });
  }
  return addLocation(details, 'proxy');
};

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = _joi2.default.object().keys({
  ssl: _joi2.default.object().keys({
    letsEncryptEmail: _joi2.default.string().trim(),
    crt: _joi2.default.string().trim(),
    key: _joi2.default.string().trim(),
    forceSSL: _joi2.default.bool()
  }).and('crt', 'key').without('letsEncryptEmail', ['crt', 'key']).or('letsEncryptEmail', 'crt', 'forceSSL'),
  domains: _joi2.default.string().required(),
  shared: _joi2.default.object().keys({
    clientUploadLimit: _joi2.default.alternatives().try(_joi2.default.number(), _joi2.default.string()),
    httpPort: _joi2.default.number(),
    httpsPort: _joi2.default.number(),
    env: _joi2.default.object().pattern(/[\s\S]*/, [_joi2.default.string(), _joi2.default.number(), _joi2.default.boolean()]),
    envLetsEncrypt: _joi2.default.object().keys({
      ACME_CA_URI: _joi2.default.string().regex(new RegExp('^(http|https)://', 'i')),
      DEBUG: _joi2.default.boolean(),
      NGINX_PROXY_CONTAINER: _joi2.default.string()
    }).pattern(/[\s\S]*/, [_joi2.default.string(), _joi2.default.number(), _joi2.default.boolean()])
  })
});
//# sourceMappingURL=validate.js.map