'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._pluginValidators = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.addPluginValidator = addPluginValidator;
exports.default = validate;

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _servers = require('./servers');

var _servers2 = _interopRequireDefault(_servers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var combineErrorDetails = utils.combineErrorDetails,
    VALIDATE_OPTIONS = utils.VALIDATE_OPTIONS,
    improveErrors = utils.improveErrors;
var _pluginValidators = exports._pluginValidators = {};

function addPluginValidator(rootPath, handler) {
  _pluginValidators[rootPath] = handler;
}

function generateSchema() {
  var topLevelKeys = {
    servers: _joi2.default.object().required(),
    app: _joi2.default.object(),
    plugins: _joi2.default.array(),
    hooks: _joi2.default.object().pattern(/.*/, _joi2.default.alternatives(_joi2.default.object({
      localCommand: _joi2.default.string(),
      remoteCommand: _joi2.default.string(),
      method: _joi2.default.func()
    }), _joi2.default.func()))
  };

  Object.keys(_pluginValidators).forEach(function (key) {
    topLevelKeys[key] = _joi2.default.any();
  });

  return _joi2.default.object().keys(topLevelKeys);
}

function validateAll(config) {
  var details = [];
  var results = void 0;

  results = _joi2.default.validate(config, generateSchema(), VALIDATE_OPTIONS);
  details = combineErrorDetails(details, results);

  if (config.servers) {
    results = (0, _servers2.default)(config.servers);
    details = combineErrorDetails(details, results);
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(_pluginValidators)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          property = _step$value[0],
          validator = _step$value[1];

      if (config[property] !== undefined) {
        results = validator(config, utils);
        details = combineErrorDetails(details, results);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return details.map(improveErrors);
}

function validate(config) {
  var errors = validateAll(config);
  return errors.map(function (error) {
    return error.message;
  });
}
//# sourceMappingURL=index.js.map