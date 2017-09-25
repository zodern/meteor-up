"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerPreparer = registerPreparer;
exports.runConfigPreps = runConfigPreps;
var _configPreps = exports._configPreps = [];

function registerPreparer(preparer) {
  _configPreps.push(preparer);
}

function runConfigPreps(_config) {
  var config = _config;

  _configPreps.forEach(function (preparer) {
    config = preparer(config) || config;
  });

  return config;
}
//# sourceMappingURL=prepare-config.js.map