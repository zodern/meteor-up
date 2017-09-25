'use strict';

var _commands = require('../commands');

var _commands2 = _interopRequireDefault(_commands);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('commands', function () {
  beforeEach(function () {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(_commands.commands)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var prop = _step.value;

        delete _commands.commands[prop];
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  describe('registerCommad', function () {
    it('should add command to list of commands', function () {
      function handler() {}
      (0, _commands2.default)('docker', 'setup', handler);
      (0, _assert2.default)(_commands.commands['docker.setup'] === handler);
    });
  });

  describe('registerCommandOverrides', function () {
    var spy = void 0;
    beforeEach(function () {
      spy = _sinon2.default.spy(console, 'log');
    });
    afterEach(function () {
      spy.restore();
    });

    it('should add override to list of commands', function () {
      function target() {}
      _commands.commands['plugin.docker-setup'] = target;
      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'plugin.docker-setup'
      });
      (0, _assert2.default)(_commands.commands['docker.setup'] === target);
    });
    it('should support shorter override format', function () {
      function target() {}
      _commands.commands['plugin.docker-setup'] = target;

      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'docker-setup'
      });
      (0, _assert2.default)(_commands.commands['docker.setup'] === target);
    });
    it('should warn when override handler doesn\'t exist', function () {
      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'docker-setup'
      });
      (0, _assert2.default)(spy.called);
    });
  });
});
//# sourceMappingURL=commands.unit.js.map