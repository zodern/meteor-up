'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  log('checking for updates');
  return new Promise(function (resolve) {
    var params = {
      timeout: 1000,
      package: _package2.default.name,
      auth: {}
    };

    var npm = new _silentNpmRegistryClient2.default();
    var uri = 'https://registry.npmjs.org/npm';
    npm.distTags.fetch(uri, params, function (err, res) {
      if (err) {
        resolve();
        return;
      }

      var showStable = true;

      var npmVersion = res.latest;
      var nextVersion = res.next;

      var local = _package2.default.version.split('.').slice(0, 3).map(function (n) {
        return Number(n.split('-')[0]);
      });
      var remote = npmVersion.split('.').map(function (n) {
        return Number(n.split('-')[0]);
      });
      var next = nextVersion.split('.').map(function (n) {
        return Number(n.split('-')[0]);
      });
      next.push(nextVersion.split('.')[2].split('beta')[1]);

      var beta = _package2.default.version.split('.')[2].split('-').length > 1;

      if (beta) {
        local.push(_package2.default.version.split('.')[2].split('beta')[1]);
      }

      var available = remote[0] > local[0] || remote[0] === local[0] && remote[1] > local[1] || remote[1] === local[1] && remote[2] > local[2];

      if (beta && !available) {
        // check if stable for beta is available
        available = remote[0] === local[0] && remote[1] === local[1] && remote[2] === local[2];
      }

      if (beta && !available) {
        available = next[3] > local[3];
        showStable = false;
      }

      if (available) {
        var version = showStable ? npmVersion : nextVersion;
        var command = showStable ? 'npm i -g mup' : 'npm i -g mup@next';

        var text = 'update available ' + _package2.default.version + ' => ' + version;
        text += '\nTo update, run ' + _chalk2.default.green(command);
        console.log((0, _boxen2.default)(text, {
          padding: 1,
          margin: 1,
          align: 'center',
          borderColor: 'yellow'
        }));
      }

      resolve();
    });
  });
};

var _silentNpmRegistryClient = require('silent-npm-registry-client');

var _silentNpmRegistryClient2 = _interopRequireDefault(_silentNpmRegistryClient);

var _boxen = require('boxen');

var _boxen2 = _interopRequireDefault(_boxen);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:updates');
//# sourceMappingURL=updates.js.map