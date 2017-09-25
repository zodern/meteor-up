'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.improveErrors = improveErrors;
exports.addLocation = addLocation;
exports.combineErrorDetails = combineErrorDetails;
exports.serversExist = serversExist;
var VALIDATE_OPTIONS = exports.VALIDATE_OPTIONS = {
  abortEarly: false,
  convert: false
};

function improveErrors(error) {
  // Todo: we can configure the joi messages instead of this
  if (error.type === 'object.allowUnknown') {
    error.message = error.message.replace(' is not allowed', ' is an unknown property');
  } else if (error.type === 'object.without') {
    error.message = error.message.replace(' conflict with forbidden peer ', ' and ') + ' cannot both be defined';
  } else if (error.type === 'object.min') {
    error.message = error.message.replace('.value', '');
  }

  return error;
}

function addLocation(details, location) {
  return details.map(function (detail) {
    // removes property name from message since it is
    // already part of detail.path
    detail.message = detail.message.replace(/^".*?"\s+/, '');

    detail.message = '"' + location + '.' + detail.path + '" ' + detail.message;
    return detail;
  });
}

function combineErrorDetails(details, results) {
  if (results instanceof Array) {
    return details.concat(results);
  }

  var additionalDetails = results.error ? results.error.details : [];

  return details.concat(additionalDetails);
}

function serversExist() {
  var serversConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var serversUsed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var messages = [];
  var servers = Object.keys(serversConfig);
  var using = Object.keys(serversUsed);
  using.forEach(function (key) {
    if (servers.indexOf(key) === -1) {
      messages.push({
        message: 'Server "' + key + '" doesn\'t exist',
        path: 'servers'
      });
    }
  });

  return messages;
}
//# sourceMappingURL=utils.js.map