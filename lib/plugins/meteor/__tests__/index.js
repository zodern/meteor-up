'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _utils = require('../../../utils');

var _mocha = require('mocha');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _chaiString = require('chai-string');

var _chaiString2 = _interopRequireDefault(_chaiString);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/* eslint-disable max-len */


_chai2.default.use(_chaiString2.default);

_shelljs2.default.config.silent = false;
var servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - meteor', function () {
  this.timeout(600000);

  (0, _mocha.describe)('setup', function () {
    var _this = this;

    (0, _mocha.it)('should setup environment on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var serverInfo, out, num, sshOut;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              serverInfo = servers['mymeteor'];
              _context.next = 3;
              return (0, _utils.runSSHCommand)(serverInfo, 'rm -rf /opt/myapp || :');

            case 3:
              _context.next = 5;
              return (0, _utils.runSSHCommand)(serverInfo, 'command -v tree >/dev/null 2>&1 || { sudo apt-get -qq update && sudo apt-get -qq install -y tree; }');

            case 5:

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              out = _shelljs2.default.exec('mup meteor setup');

              _assert2.default.equal(out.code, 0);

              num = (0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output);

              _assert2.default.equal(num, 1);

              _context.next = 12;
              return (0, _utils.runSSHCommand)(serverInfo, 'tree -pufid /opt');

            case 12:
              sshOut = _context.sent;

              (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp', 3);
              (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp/config', 1);
              (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp/tmp', 1);

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    })));
  });

  (0, _mocha.describe)('push', function () {
    var _this2 = this;

    (0, _mocha.it)('should push meteor app bundle to "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var serverInfo, out, num, sshOut;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              serverInfo = servers['mymeteor'];


              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup docker setup');
              _shelljs2.default.exec('mup meteor setup');

              out = _shelljs2.default.exec('mup meteor push --cached-build');

              _assert2.default.equal(out.code, 0);

              num = (0, _utils.countOccurences)('Pushing Meteor App Bundle to The Server: SUCCESS', out.output);

              _assert2.default.equal(num, 1);

              _context2.next = 10;
              return (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/tmp/bundle.tar.gz');

            case 10:
              sshOut = _context2.sent;

              _assert2.default.equal(sshOut.code, 0);

            case 12:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    })));
  });

  (0, _mocha.describe)('envconfig', function () {
    var _this3 = this;

    var serverInfo = servers['mymeteor'];
    (0, _mocha.it)('should send the environment variables to "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var out, num, sshOut, sshOut2;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup meteor setup');

              out = _shelljs2.default.exec('mup meteor envconfig');

              _assert2.default.equal(out.code, 0);

              num = (0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output);

              _assert2.default.equal(num, 1);

              _context3.next = 8;
              return (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/config/env.list');

            case 8:
              sshOut = _context3.sent;

              _assert2.default.equal(sshOut.code, 0);

              _context3.next = 12;
              return (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/config/start.sh');

            case 12:
              sshOut2 = _context3.sent;


              _assert2.default.equal(sshOut2.code, 0);

            case 14:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    })));
    (0, _mocha.it)('should push server specific env variables', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var out, sshOut;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-2'));
              _shelljs2.default.exec('mup meteor setup');

              out = _shelljs2.default.exec('mup meteor envconfig');


              (0, _chai.expect)(out.code).to.equal(0);

              _context4.next = 6;
              return (0, _utils.runSSHCommand)(serverInfo, 'cat /opt/myapp/config/env.list');

            case 6:
              sshOut = _context4.sent;

              (0, _chai.expect)(sshOut.output).to.have.entriesCount('TEST=true', 1);

            case 8:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this3);
    })));
  });

  (0, _mocha.describe)('start', function () {
    var _this4 = this;

    var serverInfo = servers['mymeteor'];

    (0, _mocha.it)('should start meteor on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
      var out, num, sshOut;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup setup && mup meteor push --cached-build && mup meteor envconfig');
              out = _shelljs2.default.exec('mup meteor start');

              _assert2.default.equal(out.code, 0);

              num = (0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output);

              _assert2.default.equal(num, 1);

              _context5.next = 8;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 8:
              sshOut = _context5.sent;

              _assert2.default.equal(sshOut.code, 0);

            case 10:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this4);
    })));
  });

  (0, _mocha.describe)('deploy', function () {
    var _this5 = this;

    var checkDeploy = function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(out, appText) {
        var num, num2, num3, sshOut;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _assert2.default.equal(out.code, 0);

                num = (0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output);

                _assert2.default.equal(num, 1);

                num2 = (0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output);

                _assert2.default.equal(num2, 1);

                num3 = (0, _utils.countOccurences)('Pushing Meteor App Bundle to The Server: SUCCESS', out.output);

                _assert2.default.equal(num3, 1);

                _context6.next = 9;
                return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

              case 9:
                sshOut = _context6.sent;

                _assert2.default.equal(sshOut.code, 0);
                (0, _chai.expect)(sshOut.output).to.have.entriesCount(appText, 1);

              case 12:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function checkDeploy(_x, _x2) {
        return _ref6.apply(this, arguments);
      };
    }();

    var serverInfo = servers['mymeteor'];

    (0, _mocha.it)('should deploy meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
      var out;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup setup');
              out = _shelljs2.default.exec('mup meteor deploy --cached-build');


              checkDeploy(out, '<title>helloapp-new</title>');

            case 4:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this5);
    })));

    (0, _mocha.it)('should deploy app using Meteor 1.2', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
      var out;
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup setup --config mup.old.js');
              out = _shelljs2.default.exec('mup meteor deploy --cached-build --config mup.old.js');


              checkDeploy(out, '<title>helloapp</title>');

            case 4:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this5);
    })));
  });

  (0, _mocha.describe)('logs', function () {
    var _this6 = this;

    (0, _mocha.it)('should pull the logs from "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
      var out;
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              out = _shelljs2.default.exec('mup meteor logs --tail 2');

              _assert2.default.equal(out.code, 0);

            case 3:
            case 'end':
              return _context9.stop();
          }
        }
      }, _callee9, _this6);
    })));
  });

  (0, _mocha.describe)('stop', function () {
    var _this7 = this;

    var serverInfo = servers['mymeteor'];
    (0, _mocha.it)('should stop meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
      var out, num, sshOut;
      return regeneratorRuntime.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup setup && mup deploy --cached-build');
              out = _shelljs2.default.exec('mup meteor stop');

              _assert2.default.equal(out.code, 0);

              num = (0, _utils.countOccurences)('Stop Meteor: SUCCESS', out.output);

              _assert2.default.equal(num, 1);

              _context10.next = 8;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 8:
              sshOut = _context10.sent;

              _assert2.default.equal(sshOut.code, 7);

            case 10:
            case 'end':
              return _context10.stop();
          }
        }
      }, _callee10, _this7);
    })));
  });
});
//# sourceMappingURL=index.js.map