'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _utils = require('../../../utils');

var _mocha = require('mocha');

var _chaiString = require('chai-string');

var _chaiString2 = _interopRequireDefault(_chaiString);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
/* eslint-disable max-len, no-unused-expressions */


_chai2.default.use(_chaiString2.default);

_shelljs2.default.config.silent = false;
var servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - default', function () {
  this.timeout(600000);

  (0, _mocha.describe)('deploy', function () {
    var _this = this;

    (0, _mocha.it)('should deploy meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var serverInfo, out, ssh1, ssh2;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup setup');

              out = _shelljs2.default.exec('mup deploy --cached-build');


              (0, _chai.expect)(out.code).to.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('Building App Bundle Locally', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Pushing Meteor App Bundle to The Server: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Pushing the Startup Script: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
              _context.next = 13;
              return (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017');

            case 13:
              ssh1 = _context.sent;

              (0, _chai.expect)(ssh1.code).to.be.equal(0);
              _context.next = 17;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 17:
              ssh2 = _context.sent;

              (0, _chai.expect)(ssh2.code).to.be.equal(0);

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    })));
  });

  (0, _mocha.describe)('init', function () {
    (0, _mocha.it)('should create "mup.js" and "setting.json" in /tmp/project-tmp', function () {
      var dir = _path2.default.resolve(_os2.default.tmpdir(), 'project-tmp');
      _shelljs2.default.mkdir(dir);
      _shelljs2.default.cd(dir);
      _shelljs2.default.exec('mup init');
      (0, _chai.expect)(_fs2.default.existsSync(_path2.default.resolve(dir, 'mup.js'))).to.true;
      (0, _chai.expect)(_fs2.default.existsSync(_path2.default.resolve(dir, 'settings.json'))).to.true;
      _shelljs2.default.rm('-rf', dir);
    });
  });

  (0, _mocha.describe)('logs', function () {
    (0, _mocha.it)('should pull the logs from meteor app', function () {
      _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
      var out = _shelljs2.default.exec('mup logs --tail 2');
      (0, _chai.expect)(out.code).to.be.equal(0);
    });
  });

  (0, _mocha.describe)('reconfig', function () {
    var _this2 = this;

    (0, _mocha.it)('should reconfig meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup setup  && mup deploy --cached-build');

              out = _shelljs2.default.exec('mup reconfig');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
              _context2.t0 = _chai.expect;
              _context2.next = 11;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 11:
              _context2.t1 = _context2.sent.code;
              (0, _context2.t0)(_context2.t1).to.be.equal(0);

            case 13:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    })));
  });

  (0, _mocha.describe)('restart', function () {
    var _this3 = this;

    (0, _mocha.it)('should restart meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup setup  && mup deploy --cached-build');

              out = _shelljs2.default.exec('mup restart');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)(out.output).to.have.entriesCount('Stop Meteor: SUCCESS', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('Start Meteor: SUCCESS', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('Verifying Deployment: SUCCESS', 1);
              _context3.t0 = _chai.expect;
              _context3.next = 11;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 11:
              _context3.t1 = _context3.sent.code;
              (0, _context3.t0)(_context3.t1).to.be.equal(0, 'Curl exit code');

            case 13:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    })));
  });

  (0, _mocha.describe)('setup', function () {
    var _this4 = this;

    (0, _mocha.it)('should setup "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));

              out = _shelljs2.default.exec('mup setup');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('Setup Docker: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output)).to.be.equal(2);
              (0, _chai.expect)((0, _utils.countOccurences)('Start Mongo: SUCCESS', out.output)).to.be.equal(1);
              _context4.t0 = _chai.expect;
              _context4.next = 10;
              return (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017');

            case 10:
              _context4.t1 = _context4.sent.code;
              (0, _context4.t0)(_context4.t1).to.be.equal(0);

            case 12:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    })));
  });

  (0, _mocha.describe)('start', function () {
    var _this5 = this;

    (0, _mocha.it)('should start meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup setup  && mup meteor push --cached-build && mup meteor envconfig');

              out = _shelljs2.default.exec('mup start');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
              (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
              _context5.t0 = _chai.expect;
              _context5.next = 10;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 10:
              _context5.t1 = _context5.sent.code;
              (0, _context5.t0)(_context5.t1).to.be.equal(0);

            case 12:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this5);
    })));
  });

  (0, _mocha.describe)('stop', function () {
    var _this6 = this;

    (0, _mocha.it)('should stop meteor app on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-1'));
              _shelljs2.default.exec('mup setup  && mup deploy --cached-build');

              out = _shelljs2.default.exec('mup stop');


              (0, _chai.expect)(out.code).to.be.equal(0);
              (0, _chai.expect)((0, _utils.countOccurences)('Stop Meteor: SUCCESS', out.output)).to.be.equal(1);
              _context6.t0 = _chai.expect;
              _context6.next = 9;
              return (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

            case 9:
              _context6.t1 = _context6.sent.code;
              (0, _context6.t0)(_context6.t1).to.be.equal(7);

            case 11:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this6);
    })));
  });

  (0, _mocha.describe)('syslog', function () {
    var _this7 = this;

    var serverInfo = servers['mymeteor'];

    (0, _mocha.it)('should write meteor logst to syslog on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
      var out;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-2'));

              _shelljs2.default.exec('mup setup && mup deploy --cached-build');
              _context7.next = 4;
              return (0, _utils.runSSHCommand)(serverInfo, 'sudo tail -n 100 /var/log/syslog');

            case 4:
              out = _context7.sent;

              (0, _chai.expect)(out.code).to.be.equal(0);

              (0, _chai.expect)((0, _utils.countOccurences)('=> Starting meteor app on port:80', out.output)).gte(1);

            case 7:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this7);
    })));
  });
});
//# sourceMappingURL=index.js.map