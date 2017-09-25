'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.addStdioHandlers = addStdioHandlers;
exports.runTaskList = runTaskList;
exports.getDockerLogs = getDockerLogs;
exports.createSSHOptions = createSSHOptions;
exports.runSSHCommand = runSSHCommand;
exports.countOccurences = countOccurences;
exports.resolvePath = resolvePath;
exports.filterArgv = filterArgv;

var _ssh = require('ssh2');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _expandTilde = require('expand-tilde');

var _expandTilde2 = _interopRequireDefault(_expandTilde);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _bluebird = require('bluebird');

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var log = (0, _debug2.default)('mup:utils');

function addStdioHandlers(list) {
  list._taskQueue = list._taskQueue.map(function (task) {
    task.options = task.options || {};

    task.options.onStdout = function () {
      return function (data) {
        process.stdout.write(data);
      };
    };

    task.options.onStderr = function () {
      return function (data) {
        process.stderr.write(data);
      };
    };
    return task;
  });
}

function runTaskList(list, sessions, opts) {
  if (opts && opts.verbose) {
    addStdioHandlers(list);
    delete opts.verbose;
  }
  return new Promise(function (resolve, reject) {
    list.run(sessions, opts, function (summaryMap) {
      for (var host in summaryMap) {
        if (summaryMap.hasOwnProperty(host)) {
          var summary = summaryMap[host];
          if (summary.error) {
            var error = summary.error;
            error.nodemiralHistory = summary.history;
            reject(error);

            return;
          }
        }
      }

      resolve();
    });
  });
}

// Implements a simple readable stream to pass
// the logs from nodemiral to readline which
// then splits it into individual lines.

var Callback2Stream = function (_stream$Readable) {
  _inherits(Callback2Stream, _stream$Readable);

  function Callback2Stream(options) {
    _classCallCheck(this, Callback2Stream);

    var _this = _possibleConstructorReturn(this, (Callback2Stream.__proto__ || Object.getPrototypeOf(Callback2Stream)).call(this, options));
    // Calls the stream.Readable(options) constructor


    _this.data = [];
    return _this;
  }

  _createClass(Callback2Stream, [{
    key: 'addData',
    value: function addData(data) {
      if (this.reading) {
        this.reading = this.push(data);
      } else {
        this.data.push(data);
      }
    }
  }, {
    key: '_read',
    value: function _read() {
      var _this2 = this;

      this.reading = true;
      this.data.forEach(function () {
        var shouldContinue = _this2.reading && _this2.push(_this2.data.shift());
        if (!shouldContinue) {
          _this2.reading = false;
        }
      });
    }
  }]);

  return Callback2Stream;
}(_stream2.default.Readable);

function getDockerLogs(name, sessions, args) {
  var command = 'sudo docker ' + args.join(' ') + ' ' + name + ' 2>&1';

  log('getDockerLogs command: ' + command);

  var promises = sessions.map(function (session) {
    var input = new Callback2Stream();
    var host = '[' + session._host + ']';
    var lineSeperator = _readline2.default.createInterface({
      input: input,
      terminal: true
    });
    lineSeperator.on('line', function (data) {
      console.log(host + data);
    });
    var options = {
      onStdout: function onStdout(data) {
        input.addData(data);
      },
      onStderr: function onStderr(data) {
        // the logs all come in on stdout so stderr isn't added to lineSeperator
        process.stdout.write(host + data);
      }
    };
    return (0, _bluebird.promisify)(session.execute.bind(session))(command, options);
  });
  return Promise.all(promises);
}

function createSSHOptions(server) {
  var sshAgent = process.env.SSH_AUTH_SOCK;
  var ssh = {
    host: server.host,
    port: server.opts && server.opts.port || 22,
    username: server.username
  };

  if (server.pem) {
    ssh.privateKey = _fs2.default.readFileSync(resolvePath(server.pem), 'utf8');
  } else if (server.password) {
    ssh.password = server.password;
  } else if (sshAgent && _fs2.default.existsSync(sshAgent)) {
    ssh.agent = sshAgent;
  }
  return ssh;
}

// Maybe we should create a new npm package
// for this one. Something like 'sshelljs'.
function runSSHCommand(info, command) {
  return new Promise(function (resolve, reject) {
    var conn = new _ssh.Client();

    // TODO better if we can extract SSH agent info from original session
    var sshAgent = process.env.SSH_AUTH_SOCK;
    var ssh = {
      host: info.host,
      port: info.opts && info.opts.port || 22,
      username: info.username
    };

    if (info.pem) {
      ssh.privateKey = _fs2.default.readFileSync(resolvePath(info.pem), 'utf8');
    } else if (info.password) {
      ssh.password = info.password;
    } else if (sshAgent && _fs2.default.existsSync(sshAgent)) {
      ssh.agent = sshAgent;
    }
    conn.connect(ssh);

    conn.once('error', function (err) {
      if (err) {
        reject(err);
      }
    });

    // TODO handle error events
    conn.once('ready', function () {
      conn.exec(command, function (err, outputStream) {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        var output = '';

        outputStream.on('data', function (data) {
          output += data;
        });

        outputStream.once('close', function (code) {
          conn.end();
          resolve({ code: code, output: output });
        });
      });
    });
  });
}

function countOccurences(needle, haystack) {
  var regex = new RegExp(needle, 'g');
  var match = haystack.match(regex) || [];
  return match.length;
}

function resolvePath() {
  for (var _len = arguments.length, paths = Array(_len), _key2 = 0; _key2 < _len; _key2++) {
    paths[_key2] = arguments[_key2];
  }

  var expandedPaths = paths.map(function (_path) {
    return (0, _expandTilde2.default)(_path);
  });
  return _path3.default.resolve.apply(_path3.default, _toConsumableArray(expandedPaths));
}

function filterArgv(argvArray, argv, unwanted) {
  var result = argv._.slice();
  Object.keys(argv).forEach(function (_key) {
    var add = false;
    var key = _key;
    if (unwanted.indexOf(key) === -1 && argv[key] !== false && argv[key] !== undefined) {
      add = true;
    }

    if (key.length > 1) {
      key = '--' + key;
    } else {
      key = '-' + key;
    }

    if (add) {
      if (argvArray.indexOf(key) === -1) {
        return;
      }

      result.push(key);

      if (typeof argv[_key] !== 'boolean') {
        result.push(argv[_key]);
      }
    }
  });

  return result;
}
//# sourceMappingURL=utils.js.map