'use strict';

var _chai = require('chai');

var _pluginApi = require('../plugin-api');

var _pluginApi2 = _interopRequireDefault(_pluginApi);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _validate = require('../validate');

var validate = _interopRequireWildcard(_validate);

var _commands = require('../commands');

var _hooks = require('../hooks');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('PluginAPI', function () {
  var api = void 0;
  var base = _path2.default.join(__dirname, '../../tests/fixtures/project-unit-tests');
  var filteredArgs = ['--tail'];
  var program = {
    verbose: true
  };

  beforeEach(function () {
    api = new _pluginApi2.default(base, filteredArgs, program);
  });

  describe('configPath', function () {
    it('should prefer --config option', function () {
      var _api = new _pluginApi2.default(base, filteredArgs, { config: '~/project2/.deploy/mup.js' });

      (0, _chai.expect)(_api.configPath).to.include('project2');
    });

    it('should fallback to base', function () {
      (0, _chai.expect)(api.configPath).to.equal(_path2.default.join(base, 'mup.js'));
    });
  });

  describe('base', function () {
    it('should prefer config path', function () {
      var _api = new _pluginApi2.default(base, filteredArgs, { config: '~/project2/.deploy/mup.js' });
      (0, _chai.expect)(_api.base).to.equal('~/project2/.deploy');
    });

    it('should fallback to given base', function () {
      (0, _chai.expect)(api.base).to.equal(base);
    });
  });

  describe('properties', function () {
    it('should have "program"', function () {
      (0, _chai.expect)(api).has.property('program');
    });
  });
  describe('utils', function () {
    it('should have resolvePath', function () {
      (0, _chai.expect)(api.resolvePath).to.be.a('function');
    });
    it('should have runTaskList', function () {
      (0, _chai.expect)(api.runTaskList).to.be.a('function');
    });
    it('should have getDockerLogs', function () {
      (0, _chai.expect)(api.getDockerLogs).to.be.a('function');
    });
    it('should have runSSHCommand', function () {
      (0, _chai.expect)(api.runSSHCommand).to.be.a('function');
    });
  });
  describe('getArgs', function () {
    it('should return args', function () {
      (0, _chai.expect)(api.getArgs()).to.equal(filteredArgs);
    });
  });

  describe('getBasePath', function () {
    it('should return base', function () {
      (0, _chai.expect)(api.getBasePath()).to.equal(base);
    });
  });

  describe('getVerbose', function () {
    it('should return verbose', function () {
      (0, _chai.expect)(api.getVerbose()).to.equal(true);
    });
  });

  describe('getOptions', function () {
    it('should return options', function () {
      (0, _chai.expect)(api.getOptions()).to.equal(program);
    });
  });

  describe('hasMeteorPackage', function () {
    var fsStub = void 0;
    var configStub = void 0;

    beforeEach(function () {
      fsStub = _sinon2.default.stub(_fs2.default, 'readFileSync').callsFake(function () {
        return {
          toString: function toString() {
            return '\n            package1@3\n            package2@3\n            #package3@3\n            ';
          }
        };
      });

      configStub = _sinon2.default.stub(api, 'getConfig').callsFake(function () {
        return {
          meteor: {
            path: '../'
          }
        };
      });
    });

    afterEach(function () {
      fsStub.restore();
      configStub.restore();
    });

    it('should return true if package is used', function () {
      (0, _chai.expect)(api.hasMeteorPackage('package2')).to.equal(true);
    });

    it('should ignore commented out lines', function () {
      (0, _chai.expect)(api.hasMeteorPackage('package3')).to.equal(false);
    });

    it('should return false if could not find app', function () {
      fsStub.restore();
      (0, _chai.expect)(api.hasMeteorPackage('package2')).to.equal(false);
    });
  });

  describe('validateConfig', function () {
    var errors = ['error1', 'error2'];
    var validatorStub = void 0;
    var totalConsoleOutput = '';
    var consoleStub = void 0;
    beforeEach(function () {
      totalConsoleOutput = '';
      validatorStub = _sinon2.default.stub(validate, 'default').returns(errors);
      consoleStub = _sinon2.default.stub(console, 'log').callsFake(function () {
        for (var _len = arguments.length, text = Array(_len), _key = 0; _key < _len; _key++) {
          text[_key] = arguments[_key];
        }

        totalConsoleOutput += text.join(' ');
      });
    });

    afterEach(function () {
      validatorStub.restore();
      consoleStub.restore();
    });

    it('should show validation errors', function () {
      api.validateConfig(api.configPath);

      (0, _chai.expect)(totalConsoleOutput).to.contain('- error1');
      (0, _chai.expect)(totalConsoleOutput).to.contain('- error2');
    });

    it('should show nothing when config is valid', function () {
      errors.splice(0, errors.length);

      api.validateConfig(api.configPath);

      (0, _chai.expect)(totalConsoleOutput).to.equal('');
    });
  });

  describe('_normalizeConfig', function () {
    it('should copy meteor object to app', function () {
      var expected = { meteor: { path: '../' }, app: { type: 'meteor', path: '../', docker: { image: 'kadirahq/meteord' } } };
      var config = { meteor: { path: '../' } };
      var result = api._normalizeConfig(config);

      (0, _chai.expect)(result).to.deep.equal(expected);
    });
  });

  describe('setConfig', function () {
    it('should update the old config', function () {
      var newConfig = { servers: { two: 0 } };
      api.setConfig(newConfig);

      (0, _chai.expect)(api.getConfig()).to.deep.equal(newConfig);
    });
  });

  describe('runCommand', function () {
    var commandCalled = false;
    var preHookCalled = false;
    var postHookCalled = false;

    beforeEach(function () {
      _hooks.hooks['pre.test.logs'] = [{
        method: function method() {
          preHookCalled = true;
        }
      }];
      _hooks.hooks['post.test.logs'] = [{
        method: function method() {
          postHookCalled = true;
        }
      }];

      _commands.commands['test.logs'] = {
        handler: function handler() {
          commandCalled = true;
        }
      };

      commandCalled = false;
      preHookCalled = false;
      postHookCalled = false;
    });

    after(function () {
      delete _hooks.hooks['pre.test.logs'];
      delete _hooks.hooks['post.test.logs'];
      delete _commands.commands['test.logs'];
    });

    it('should throw if name is not provided', function (cb) {
      api.runCommand().catch(function () {
        cb();
      });
    });

    it('should throw if unknown command', function (cb) {
      api.runCommand('nonexistent.command').catch(function () {
        cb();
      });
    });

    it('should run command', function (cb) {
      api.runCommand('test.logs').then(function () {
        (0, _chai.expect)(commandCalled).to.equal(true);
        cb();
      });
    });

    it('should run hooks', function (cb) {
      api.runCommand('test.logs').then(function () {
        (0, _chai.expect)(preHookCalled).to.equal(true);
        (0, _chai.expect)(postHookCalled).to.equal(true);
        cb();
      }).catch(function (e) {
        console.log(e);
      });
    });
  });

  describe('getSessions', function () {
    it('should return sessions for plugins', function () {
      var sessions = api.getSessions(['meteor', 'mongo']);
      (0, _chai.expect)(sessions).to.have.length(2);
    });
  });

  describe('_loadSessions', function () {
    it('should add sessions to this.sessions', function () {
      api._loadSessions();
      (0, _chai.expect)(api.sessions).to.have.keys('one', 'two');
    });
  });

  describe('_pickSessions', function () {
    it('should return sessions for each plugin', function () {
      var result = api._pickSessions(['meteor', 'mongo']);
      (0, _chai.expect)(result).to.have.keys('one', 'two');
    });
  });
});
//# sourceMappingURL=plugin-api.unit.js.map