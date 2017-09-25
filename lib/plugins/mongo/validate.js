'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (config, _ref) {
  var combineErrorDetails = _ref.combineErrorDetails,
      serversExist = _ref.serversExist,
      addLocation = _ref.addLocation,
      VALIDATE_OPTIONS = _ref.VALIDATE_OPTIONS;

  var details = [];

  var validationErrors = _joi2.default.validate(config.mongo, schema, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, validationErrors);
  details = combineErrorDetails(details, serversExist(config.servers, config.mongo.servers));
  return addLocation(details, 'mongo');
};

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = _joi2.default.object().keys({
  // TODO: mongo.oplog and mongo.port is unused,
  // but was part of the example config.
  // decide what to do with it
  oplog: _joi2.default.bool(),
  port: _joi2.default.number(),
  version: _joi2.default.string(),
  servers: _joi2.default.object().keys().required()
});
//# sourceMappingURL=validate.js.map