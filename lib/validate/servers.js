'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validateServers;

var _utils = require('./utils');

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The regexp used matches everything
var schema = _joi2.default.object().keys().pattern(/.*/, {
  host: _joi2.default.alternatives(_joi2.default.string().trim()).required(),
  username: _joi2.default.string().required(),
  pem: _joi2.default.string().trim(),
  password: _joi2.default.string(),
  opts: _joi2.default.object().keys({
    port: _joi2.default.number()
  })
});

function validateServers(servers) {
  var details = [];
  var result = _joi2.default.validate(servers, schema, _utils.VALIDATE_OPTIONS);
  details = (0, _utils.combineErrorDetails)(details, result);

  Object.keys(servers).forEach(function (key) {
    var server = servers[key];
    if (server.pem && server.pem.indexOf('.pub') === server.pem.length - 4) {
      details.push({
        message: 'Needs to be a path to a private key. The file extension ".pub" is used for public keys.',
        path: key + '.pem'
      });
    }
  });

  return (0, _utils.addLocation)(details, 'servers');
}
//# sourceMappingURL=servers.js.map