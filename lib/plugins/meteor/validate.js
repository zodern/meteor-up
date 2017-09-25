'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (config, _ref) {
  var combineErrorDetails = _ref.combineErrorDetails,
      VALIDATE_OPTIONS = _ref.VALIDATE_OPTIONS,
      serversExist = _ref.serversExist,
      addLocation = _ref.addLocation;

  var details = [];
  details = combineErrorDetails(details, _joi2.default.validate(config.app, schema, VALIDATE_OPTIONS));
  if (config.app.name && config.app.name.indexOf(' ') > -1) {
    details.push({
      message: 'has a space',
      path: 'name'
    });
  }
  if (_typeof(config.app.ssl) === 'object' && 'autogenerate' in config.app.ssl && 'PORT' in config.app.env) {
    details.push({
      message: 'PORT can not be set when using ssl.autogenerate',
      path: 'env'
    });
  }
  details = combineErrorDetails(details, serversExist(config.servers, config.app.servers));

  return addLocation(details, config.meteor ? 'meteor' : 'app');
};

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = _joi2.default.object().keys({
  name: _joi2.default.string().min(1).required(),
  path: _joi2.default.string().min(1).required(),
  port: _joi2.default.number(),
  type: _joi2.default.string(),
  servers: _joi2.default.object().required().pattern(/[/s/S]*/, _joi2.default.object().keys({
    env: _joi2.default.object().pattern(/[/s/S]*/, [_joi2.default.string(), _joi2.default.number(), _joi2.default.bool()])
  })),
  deployCheckWaitTime: _joi2.default.number(),
  deployCheckPort: _joi2.default.number(),
  enableUploadProgressBar: _joi2.default.bool(),
  dockerImage: _joi2.default.string(),
  docker: _joi2.default.object().keys({
    image: _joi2.default.string().trim(),
    imagePort: _joi2.default.number(),
    imageFrontendServer: _joi2.default.string(),
    args: _joi2.default.array().items(_joi2.default.string()),
    bind: _joi2.default.string().trim(),
    prepareBundle: _joi2.default.bool(),
    networks: _joi2.default.array().items(_joi2.default.string())
  }),
  buildOptions: _joi2.default.object().keys({
    serverOnly: _joi2.default.bool(),
    debug: _joi2.default.bool(),
    cleanAfterBuild: _joi2.default.bool(),
    buildLocation: _joi2.default.string(),
    mobileSettings: _joi2.default.object(),
    server: _joi2.default.string().uri(),
    allowIncompatibleUpdates: _joi2.default.boolean(),
    executable: _joi2.default.string()
  }),
  env: _joi2.default.object().keys({
    ROOT_URL: _joi2.default.string().regex(new RegExp('^(http|https)://', 'i'), 'valid url with "http://" or "https://"').required(),
    MONGO_URL: _joi2.default.string()
  }).pattern(/[\s\S]*/, [_joi2.default.string(), _joi2.default.number(), _joi2.default.bool()]),
  log: _joi2.default.object().keys({
    driver: _joi2.default.string(),
    opts: _joi2.default.object()
  }),
  volumes: _joi2.default.object(),
  nginx: _joi2.default.object().keys({
    clientUploadLimit: _joi2.default.string().trim()
  }),
  ssl: _joi2.default.object().keys({
    autogenerate: _joi2.default.object().keys({
      email: _joi2.default.string().email().required(),
      domains: _joi2.default.string().required()
    }),
    crt: _joi2.default.string().trim(),
    key: _joi2.default.string().trim(),
    port: _joi2.default.number(),
    upload: _joi2.default.boolean()
  }).and('crt', 'key').without('autogenerate', ['crt', 'key']).or('crt', 'autogenerate')
});
//# sourceMappingURL=validate.js.map