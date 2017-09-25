'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _mocha = require('mocha');

var _chaiString = require('chai-string');

var _chaiString2 = _interopRequireDefault(_chaiString);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../../../utils');

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var servers = require('../../../../tests/fixtures/servers');

_chai2.default.use(_chaiString2.default);

_shelljs2.default.config.silent = false;

(0, _mocha.describe)('module - proxy', function () {
  var _this2 = this;

  this.timeout(60000000);

  (0, _mocha.describe)('setup', function () {
    var _this = this;

    (0, _mocha.it)('should setup proxy on "meteor" vm', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-3'));
              out = _shelljs2.default.exec('mup setup');


              (0, _chai.expect)(out.code).to.equal(0);
              (0, _chai.expect)(out.output).to.have.entriesCount('Setup proxy', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

              _context.next = 8;
              return (0, _utils.runSSHCommand)(serverInfo, 'docker ps');

            case 8:
              out = _context.sent;


              (0, _chai.expect)(out.code).to.equal(0);
              (0, _chai.expect)(out.output).to.have.entriesCount('mup-nginx-proxy', 2);
              (0, _chai.expect)(out.output).to.have.entriesCount('mup-nginx-proxy-letsencrypt', 1);

              _context.next = 14;
              return (0, _utils.runSSHCommand)(serverInfo, 'du --max-depth=2 /opt');

            case 14:
              out = _context.sent;

              (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy', 4);
              (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/certs', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/mounted-certs', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/config', 1);

              _context.next = 21;
              return (0, _utils.runSSHCommand)(serverInfo, 'ls /opt/mup-nginx-proxy/config');

            case 21:
              out = _context.sent;

              (0, _chai.expect)(out.output).to.have.entriesCount('shared-config.sh', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('env.list', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('env_letsencrypt.list', 1);

            case 25:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    })));
  });

  (0, _mocha.describe)('reconfig-shared', function () {
    (0, _mocha.it)('it should update shared settings', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var serverInfo, out;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              serverInfo = servers['mymeteor'];

              _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-3'));
              _shelljs2.default.exec('mup setup');

              out = _shelljs2.default.exec('mup proxy reconfig-shared');

              (0, _chai.expect)(out.code).to.equal(0);
              (0, _chai.expect)(out.output).to.have.entriesCount('Configuring Proxy\'s Shared Settings', 1);
              (0, _chai.expect)(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

              _context2.next = 9;
              return (0, _utils.runSSHCommand)(serverInfo, 'cat /opt/mup-nginx-proxy/config/shared-config.sh');

            case 9:
              out = _context2.sent;

              (0, _chai.expect)(out.output).to.have.entriesCount('CLIENT_UPLOAD_LIMIT=10M', 1);

            case 11:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    })));
  });

  (0, _mocha.describe)('logs', function () {
    (0, _mocha.it)('should show nginx logs', function () {
      _shelljs2.default.cd(_path2.default.resolve(_os2.default.tmpdir(), 'tests/project-3'));
      _shelljs2.default.exec('mup setup');

      var out = _shelljs2.default.exec('mup proxy logs --tail 2');
      (0, _chai.expect)(out.output).to.have.entriesCount('Received event start for', 1);
      (0, _chai.expect)(out.code).to.equal(0);
    });
  });
});
//# sourceMappingURL=index.js.map