import assert from 'assert';
import { serversExist } from '../utils';

describe('validator utils', function() {
  describe('serversExist', function() {
    it('should find nonexistent servers', function() {
      const serversConfig = { one: {}, two: {} };
      const usedServers = { one: {}, three: {}};
      const result = serversExist(serversConfig, usedServers);
      const expectedLength = 1;

      assert(result.length === expectedLength);
    });
  });
});
