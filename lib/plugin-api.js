'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _hooks = require('./hooks');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _commands = require('./commands');

var _index = require('./validate/index');

var _index2 = _interopRequireDefault(_index);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodemiral = require('nodemiral');

var _nodemiral2 = _interopRequireDefault(_nodemiral);

var _parseJson = require('parse-json');

var _parseJson2 = _interopRequireDefault(_parseJson);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prepareConfig = require('./prepare-config');

var _scrubConfig2 = require('./scrub-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var resolvePath = utils.resolvePath;

var PluginAPI = function () {
  function PluginAPI(base, filteredArgs, program) {
    _classCallCheck(this, PluginAPI);

    this._runHooks = function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(handlers, hookName) {
        var messagePrefix, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, hookHandler;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                messagePrefix = '> Running hook ' + hookName;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 4;
                _iterator = handlers[Symbol.iterator]();

              case 6:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 25;
                  break;
                }

                hookHandler = _step.value;

                if (hookHandler.localCommand) {
                  console.log(messagePrefix + ' "' + hookHandler.localCommand + '"');
                  this._runHookScript(hookHandler.localCommand);
                }

                if (!(typeof hookHandler.method === 'function')) {
                  _context.next = 18;
                  break;
                }

                _context.prev = 10;
                _context.next = 13;
                return hookHandler.method(this, _nodemiral2.default);

              case 13:
                _context.next = 18;
                break;

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](10);

                this._commandErrorHandler(_context.t0);

              case 18:
                if (!hookHandler.remoteCommand) {
                  _context.next = 22;
                  break;
                }

                console.log(messagePrefix + ' remote command "' + hookHandler.remoteCommand + '"');
                _context.next = 22;
                return (0, _hooks.runRemoteHooks)(this.getConfig().servers, hookHandler.remoteCommand);

              case 22:
                _iteratorNormalCompletion = true;
                _context.next = 6;
                break;

              case 25:
                _context.next = 31;
                break;

              case 27:
                _context.prev = 27;
                _context.t1 = _context['catch'](4);
                _didIteratorError = true;
                _iteratorError = _context.t1;

              case 31:
                _context.prev = 31;
                _context.prev = 32;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 34:
                _context.prev = 34;

                if (!_didIteratorError) {
                  _context.next = 37;
                  break;
                }

                throw _iteratorError;

              case 37:
                return _context.finish(34);

              case 38:
                return _context.finish(31);

              case 39:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 27, 31, 39], [10, 15], [32,, 34, 38]]);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();

    this._runPreHooks = function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(name) {
        var hookName, hookList;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                hookName = 'pre.' + name;


                if (this.program['show-hook-names']) {
                  console.log(_chalk2.default.yellow('Hook: ' + hookName));
                }

                if (!(hookName in _hooks.hooks)) {
                  _context2.next = 6;
                  break;
                }

                hookList = _hooks.hooks[hookName];
                _context2.next = 6;
                return this._runHooks(hookList, name);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function (_x3) {
        return _ref2.apply(this, arguments);
      };
    }();

    this._runPostHooks = function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(commandName) {
        var hookName, hookList;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                hookName = 'post.' + commandName;


                if (this.program['show-hook-names']) {
                  console.log(_chalk2.default.yellow('Hook: ' + hookName));
                }

                if (!(hookName in _hooks.hooks)) {
                  _context3.next = 6;
                  break;
                }

                hookList = _hooks.hooks[hookName];
                _context3.next = 6;
                return this._runHooks(hookList, hookName);

              case 6:
                return _context3.abrupt('return');

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function (_x4) {
        return _ref3.apply(this, arguments);
      };
    }();

    this.runCommand = function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(name) {
        var _this = this;

        var potentialPromise;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (name) {
                  _context4.next = 2;
                  break;
                }

                throw new Error('Command name is required');

              case 2:
                if (name in _commands.commands) {
                  _context4.next = 4;
                  break;
                }

                throw new Error('Unknown command name: ' + name);

              case 4:
                _context4.next = 6;
                return this._runPreHooks(name);

              case 6:
                potentialPromise = void 0;

                try {
                  potentialPromise = _commands.commands[name].handler(this, _nodemiral2.default);
                } catch (e) {
                  this._commandErrorHandler(e);
                  process.exit(1);
                }

                if (!(potentialPromise && typeof potentialPromise.then === 'function')) {
                  _context4.next = 10;
                  break;
                }

                return _context4.abrupt('return', potentialPromise.then(function () {
                  return _this._runPostHooks(name);
                }));

              case 10:
                _context4.next = 12;
                return this._runPostHooks(name);

              case 12:
                return _context4.abrupt('return', _context4.sent);

              case 13:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function (_x5) {
        return _ref4.apply(this, arguments);
      };
    }();

    this.base = program['config'] ? _path2.default.dirname(program['config']) : base;
    this.args = filteredArgs;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this._enabledSessions = program.servers ? program.servers.split(',') : [];
    this.configPath = program['config'] ? resolvePath(program['config']) : _path2.default.join(this.base, 'mup.js');
    this.settingsPath = program['settings'];
    this.verbose = program.verbose;
    this.program = program;

    this.validationErrors = [];

    this.resolvePath = utils.resolvePath;
    this.runTaskList = utils.runTaskList;
    this.getDockerLogs = utils.getDockerLogs;
    this.runSSHCommand = utils.runSSHCommand;
    this._createSSHOptions = utils.createSSHOptions;
  }

  _createClass(PluginAPI, [{
    key: 'getArgs',
    value: function getArgs() {
      return this.args;
    }
  }, {
    key: 'getBasePath',
    value: function getBasePath() {
      return this.base;
    }
  }, {
    key: 'getVerbose',
    value: function getVerbose() {
      return this.verbose;
    }
  }, {
    key: 'getOptions',
    value: function getOptions() {
      return this.program;
    }
  }, {
    key: 'hasMeteorPackage',
    value: function hasMeteorPackage(name) {
      // Check if app is using the package
      try {
        var contents = _fs2.default.readFileSync(resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')).toString();
        // Looks for "package-name@" in the beginning of a
        // line or at the start of the file
        var regex = new RegExp('(^|\\s)' + name + '@', 'm');
        return regex.test(contents);
      } catch (e) {
        console.log('Unable to load file ' + resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions'));
        return false;
      }
    }
  }, {
    key: 'validateConfig',
    value: function validateConfig(configPath) {
      // Only print errors once.
      if (this.validationErrors.length > 0) {
        return this.validationErrors;
      }

      var problems = (0, _index2.default)(this.getConfig());

      if (problems.length > 0) {
        var red = _chalk2.default.red;
        var plural = problems.length > 1 ? 's' : '';

        console.log('loaded config from ' + configPath);
        console.log('');
        console.log(red(problems.length + ' Validation Error' + plural));

        problems.forEach(function (problem) {
          console.log(red('  - ' + problem));
        });

        console.log('');
        console.log('Read the docs and view example configs at');
        console.log('    http://meteor-up.com/docs');
        console.log('');
      }

      this.validationErrors = problems;
      return problems;
    }
  }, {
    key: '_normalizeConfig',
    value: function _normalizeConfig(config) {
      if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
        return config;
      }
      if (config.meteor && _typeof(config.app) !== 'object') {
        config.app = Object.assign({}, config.meteor);
        config.app.type = 'meteor';
      } else if (_typeof(config.app) === 'object' && !('type' in config.app)) {
        config.app.type = 'meteor';
      }

      return (0, _prepareConfig.runConfigPreps)(config);
    }
  }, {
    key: 'getConfig',
    value: function getConfig() {
      var validate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (!this.config) {
        try {
          // eslint-disable-next-line global-require
          this.config = require(this.configPath);
        } catch (e) {
          if (!validate) {
            return {};
          }
          if (e.code === 'MODULE_NOT_FOUND') {
            console.error('"mup.js" file not found at');
            console.error('  ' + this.configPath);
            console.error('Run "mup init" to create it.');
          } else {
            console.error(e);
          }
          process.exit(1);
        }
        if (validate) {
          this.validateConfig(this.configPath);
        }
        this.config = this._normalizeConfig(this.config);
      }

      return this.config;
    }
  }, {
    key: 'scrubConfig',
    value: function scrubConfig() {
      var config = this.getConfig();
      return (0, _scrubConfig2.scrubConfig)(config);
    }
  }, {
    key: 'getSettings',
    value: function getSettings() {
      if (!this.settings) {
        var filePath = void 0;
        if (this.settingsPath) {
          filePath = resolvePath(this.settingsPath);
        } else {
          filePath = _path2.default.join(this.base, 'settings.json');
        }

        try {
          this.settings = _fs2.default.readFileSync(filePath).toString();
        } catch (e) {
          console.log('Unable to load settings.json at ' + filePath);
          if (e.code !== 'ENOENT') {
            console.log(e);
          } else {
            ['It does not exist.', '', 'You can create the file with "mup init" or add the option', '"--settings path/to/settings.json" to load it from a', 'different location.'].forEach(function (text) {
              return console.log(text);
            });
          }
          process.exit(1);
        }
        try {
          this.settings = (0, _parseJson2.default)(this.settings);
        } catch (e) {
          console.log('Error parsing settings file:');
          console.log(e.message);

          process.exit(1);
        }
      }

      return this.settings;
    }
  }, {
    key: 'setConfig',
    value: function setConfig(newConfig) {
      this.config = newConfig;
    }
  }, {
    key: '_runHookScript',
    value: function _runHookScript(script) {
      try {
        _child_process2.default.execSync(script, {
          cwd: this.getBasePath(),
          stdio: 'inherit'
        });
      } catch (e) {
        // do nothing
      }
    }
  }, {
    key: '_commandErrorHandler',
    value: function _commandErrorHandler(e) {
      process.exitCode = 1;

      if (e.nodemiralHistory instanceof Array) {
        // Error is from nodemiral when running a task list.
        // Nodemiral should have already displayed the error
        return;
      }

      console.error(e);
    }
  }, {
    key: 'getSessions',
    value: function getSessions() {
      var modules = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var sessions = this._pickSessions(modules);
      return Object.keys(sessions).map(function (name) {
        return sessions[name];
      });
    }
  }, {
    key: '_pickSessions',
    value: function _pickSessions() {
      var _this2 = this;

      var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (!this.sessions) {
        this._loadSessions();
      }

      var sessions = {};

      plugins.forEach(function (moduleName) {
        var moduleConfig = _this2.getConfig()[moduleName];
        if (!moduleConfig) {
          return;
        }

        for (var name in moduleConfig.servers) {
          if (!moduleConfig.servers.hasOwnProperty(name)) {
            continue;
          }

          if (_this2.sessions[name]) {
            sessions[name] = _this2.sessions[name];
          }
        }
      });

      return sessions;
    }
  }, {
    key: '_loadSessions',
    value: function _loadSessions() {
      var config = this.getConfig();
      this.sessions = {};

      // `mup.servers` contains login information for servers
      // Use this information to create nodemiral sessions.
      for (var name in config.servers) {
        if (!config.servers.hasOwnProperty(name)) {
          continue;
        }

        if (this._enabledSessions.length > 0 && this._enabledSessions.indexOf(name) === -1) {
          continue;
        }

        var info = config.servers[name];
        var auth = {
          username: info.username
        };
        var opts = {
          ssh: {}
        };

        var sshAgent = process.env.SSH_AUTH_SOCK;

        if (info.opts) {
          opts.ssh = info.opts;
        }

        if (info.pem) {
          try {
            auth.pem = _fs2.default.readFileSync(resolvePath(info.pem), 'utf8');
          } catch (e) {
            console.error('Unable to load pem at "' + resolvePath(info.pem) + '"');
            console.error('for server "' + name + '"');
            if (e.code !== 'ENOENT') {
              console.log(e);
            }
            process.exit(1);
          }
        } else if (info.password) {
          auth.password = info.password;
        } else if (sshAgent && _fs2.default.existsSync(sshAgent)) {
          opts.ssh.agent = sshAgent;
        } else {
          console.error("error: server %s doesn't have password, ssh-agent or pem", name);
          process.exit(1);
        }

        var session = _nodemiral2.default.session(info.host, auth, opts);
        this.sessions[name] = session;
      }
    }
  }]);

  return PluginAPI;
}();

exports.default = PluginAPI;
//# sourceMappingURL=plugin-api.js.map