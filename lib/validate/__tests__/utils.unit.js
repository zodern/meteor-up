'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('validator utils', function () {
  describe('serversExist', function () {
    it('should find nonexistent servers', function () {
      var serversConfig = { one: {}, two: {} };
      var usedServers = { one: {}, three: {} };
      var result = (0, _utils.serversExist)(serversConfig, usedServers);
      var expectedLength = 1;

      (0, _assert2.default)(result.length === expectedLength);
    });
  });
});
//# sourceMappingURL=utils.unit.js.map