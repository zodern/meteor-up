import { addDepreciation, addLocation, serversExist } from '../utils';
import assert from 'assert';

describe('validator utils', () => {
  describe('serversExist', () => {
    it('should find nonexistent servers', () => {
      const serversConfig = { one: {}, two: {} };
      const usedServers = { one: {}, three: {} };
      const result = serversExist(serversConfig, usedServers);
      const expectedLength = 1;

      assert(result.length === expectedLength);
    });
  });
  describe('addDepreciation', () => {
    it('should add a depreciation detail', () => {
      const details = [];
      const path = 'servers.test';
      const reason = 'Use "testing" instead';
      const link = 'http://google.com';

      const [result] = addDepreciation(details, path, reason, link);

      assert(result.type === 'depreciation');
      assert(result.path === path);
      assert(result.message.indexOf(reason) > -1);
      assert(result.message.indexOf(link) > -1);
    });
  });

  describe('addLocation', () => {
    it('should add location to message', () => {
      const expected = '"app.a.b.c" message';
      const details = [{
        path: ['a', 'b', 'c'],
        message: 'message'
      }];
      const location = 'app';

      const [{ message }] = addLocation(details, location);

      assert(message === expected, message);
    });
    it('should support paths from joi v10', () => {
      const expected = '"app.a.b.c" message';
      const details = [{
        path: 'a.b.c',
        message: 'message'
      }];
      const location = 'app';

      const [{ message }] = addLocation(details, location);

      assert(message === expected, message);
    });
  });
});
