import assert from 'assert';
import { serversExist } from '../utils';

describe('validator utils', () => {
  describe('serversExist', () => {
    it('should find nonexistent servers', () => {
      const serversConfig = { one: {}, two: {} };
      const usedServers = { one: {}, three: {}};
      const result = serversExist(serversConfig, usedServers);
      const expectedLength = 1;

      assert(result.length === expectedLength);
    });
  });
});
