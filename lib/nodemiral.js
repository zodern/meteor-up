'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // Registers additional nodemiral tasks


var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function copy(session, _options, callback) {
  var options = (0, _lodash.clone)(_options);
  var retries = 0;

  if (_typeof(options.hostVars) === 'object' && options.hostVars[session._host]) {
    options.vars = (0, _lodash.merge)(options.vars, options.hostVars[session._host]);
  }

  function doCopy() {
    session.copy(options.src, options.dest, options, cb);
  }
  function cb(err) {
    if (err && retries < 3) {
      console.log('Failed to copy file ', err);
      console.log('Retrying in 3 seconds');

      setTimeout(doCopy, 3000);
      return;
    }
    callback(err);
  }

  doCopy();
}

_nodemiral2.default.registerTask('copy', copy);
//# sourceMappingURL=nodemiral.js.map