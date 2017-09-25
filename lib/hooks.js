'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runRemoteHooks = exports.hooks = undefined;

var runRemoteHooks = exports.runRemoteHooks = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(serversConfig, command) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', Promise.all(Object.values(serversConfig).map(function (server) {
              return (0, _utils.runSSHCommand)(server, command).then(function (_ref2) {
                var output = _ref2.output;

                console.log('=> output from ' + server.host);
                console.log(output);
              }).catch(function (e) {
                console.error('Error running remote hook command: ' + command);
                console.error(e);
              });
            })));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function runRemoteHooks(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.registerHook = registerHook;

var _utils = require('./utils');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var hooks = exports.hooks = {};

function registerHook(_hookName, _handler) {
  var hookName = _hookName;
  var handler = _handler;

  if ((0, _utils.countOccurences)('\\.', hookName) === 1) {
    var sections = hookName.split('.');
    hookName = sections[0] + '.default.' + sections[1];
  }

  if (typeof handler === 'function') {
    handler = {
      method: _handler
    };
  }

  if (hookName in hooks) {
    hooks[hookName].push(handler);
  } else {
    hooks[hookName] = [handler];
  }
}
//# sourceMappingURL=hooks.js.map