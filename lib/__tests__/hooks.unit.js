'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _hooks = require('../hooks');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('hooks', function () {
  beforeEach(function () {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(_hooks.hooks)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var prop = _step.value;

        delete _hooks.hooks[prop];
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

  it('should create new hooks', function () {
    var target = { localScript: 'test' };

    (0, _hooks.registerHook)('pre.default.setup', target);
    (0, _assert2.default)(_hooks.hooks['pre.default.setup'].length === 1);
    (0, _assert2.default)(_hooks.hooks['pre.default.setup'][0] === target);
  });

  it('should add hooks when some already exist', function () {
    var target = { localScript: 'test' };

    (0, _hooks.registerHook)('pre.default.setup', target);
    (0, _hooks.registerHook)('pre.default.setup', target);

    (0, _assert2.default)(_hooks.hooks['pre.default.setup'].length === 2);
    (0, _assert2.default)(_hooks.hooks['pre.default.setup'][1] === target);
  });

  it('should add missing plugin name to hooks for default commands', function () {
    var target = { localScript: 'test' };
    (0, _hooks.registerHook)('pre.setup', target);

    (0, _assert2.default)(_hooks.hooks['pre.default.setup'][0] === target);
  });
  it('should move functions to the method property', function () {
    var target = function target() {};

    (0, _hooks.registerHook)('pre.setup', target);
    console.dir(_hooks.hooks);

    (0, _assert2.default)(_hooks.hooks['pre.default.setup'][0].method === target);
  });
});
//# sourceMappingURL=hooks.unit.js.map