'use strict';

var _utils = require('../../../utils');

var _mocha = require('mocha');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
/* eslint-disable max-len */


_shelljs2.default.config.silent = false;
var servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - docker', function () {
  this.timeout(6000000);

  (0, _mocha.describe)('setup', function () {
    // reuse this function for 3 tests below
    // TODO break this into multiple functions
    // so parts can be used for other tests
    function checkDocker(name) {
      // TODO get server name form mup.js file
      var serverInfo = servers['my' + name];

      return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var out, num, sshOut;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.timeout(60000);

                _shelljs2.default.cd((0, _utils.resolvePath)(_os2.default.tmpdir(), 'tests/project-1'));
                out = _shelljs2.default.exec('mup docker setup');

                _assert2.default.equal(out.code, 0);

                num = (0, _utils.countOccurences)('Setup Docker: SUCCESS', out.output);

                _assert2.default.equal(num, 1);

                _context.next = 8;
                return (0, _utils.runSSHCommand)(serverInfo, 'which docker');

              case 8:
                sshOut = _context.sent;

                _assert2.default.equal(sshOut.code, 0);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
    }

    (0, _mocha.it)('should install docker on "meteor" vm', checkDocker('meteor'));
    (0, _mocha.it)('should install docker on "mongo" vm', checkDocker('mongo'));
    (0, _mocha.it)('should install docker on "proxy" vm', checkDocker('proxy'));
  });
});
//# sourceMappingURL=index.js.map