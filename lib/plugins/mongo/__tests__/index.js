'use strict';

var _utils = require('../../../utils');

var _mocha = require('mocha');

var _chai = require('chai');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/* eslint-disable max-len */


_shelljs2.default.config.silent = false;
var servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - mongo', function () {
  this.timeout(600000);

  (0, _mocha.describe)('logs', function () {
    var _this = this;

    (0, _mocha.it)('should pull logs from "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var out;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              _shelljs2.default.exec('mup setup');
              out = _shelljs2.default.exec('mup mongo logs');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('MongoDB starting :', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('db version', out.output)).to.be.equal(1);

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    })));
  });

  (0, _mocha.describe)('setup', function () {
    var _this2 = this;

    (0, _mocha.it)('should setup mongodb on "mongo" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var serverInfo, out, sshOut;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              serverInfo = servers['mymongo'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              out = _shelljs2.default.exec('mup mongo setup');

              (0, _chai.expect)(out.code).to.be.equal(0);

              (0, _chai.expect)((0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Copying mongodb.conf: SUCCESS', out.output)).to.be.equal(1);

              _context2.next = 8;
              return (0, _utils.runSSHCommand)(serverInfo, 'tree -pufi /opt');

            case 8:
              sshOut = _context2.sent;

              (0, _chai.expect)(sshOut.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('mongodb.conf', sshOut.output)).to.be.equal(1);

            case 11:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    })));
  });

  (0, _mocha.describe)('start', function () {
    var _this3 = this;

    (0, _mocha.it)('should start mongodb on "mongo" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              serverInfo = servers['mymongo'];


              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup docker setup && mup mongo setup');

              out = _shelljs2.default.exec('mup mongo start');

              (0, _chai.expect)(out.code).to.be.equal(0);

              (0, _chai.expect)((0, _utils.countOccurences)('Start Mongo: SUCCESS', out.output)).to.be.equal(1);
              _context3.t0 = _chai.expect;
              _context3.next = 9;
              return (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017');

            case 9:
              _context3.t1 = _context3.sent.code;
              (0, _context3.t0)(_context3.t1).to.be.equal(0);

            case 11:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    })));
  });

  (0, _mocha.describe)('stop', function () {
    var _this4 = this;

    (0, _mocha.it)('should stop mongodb on "mongo" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              serverInfo = servers['mymongo'];


              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup docker setup && mup mongo setup && mup mongo start');

              out = _shelljs2.default.exec('mup mongo stop');

              (0, _chai.expect)(out.code).to.be.equal(0);

              (0, _chai.expect)((0, _utils.countOccurences)('stop mongo: SUCCESS', out.output)).to.be.equal(1);
              _context4.t0 = _chai.expect;
              _context4.next = 9;
              return (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017');

            case 9:
              _context4.t1 = _context4.sent.code;
              (0, _context4.t0)(_context4.t1).to.be.equal(1);

            case 11:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    })));
  });
});
//# sourceMappingURL=index.js.map