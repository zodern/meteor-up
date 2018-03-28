import modules, { locatePluginDir } from '../load-plugins';
import { expect } from 'chai';

describe('load-plugins', () => {
  it('should load included plugins', () => {
    expect(Object.keys(modules)).to.have.length.greaterThan(4);
    expect(Object.keys(modules)).to.contain('default');
  });

  describe('locatePluginDir', () => {
    it('should identify paths', () => {
      const configPath = '/projects/a/mup.js';

      function createResult(value) {
        return locatePluginDir(value, configPath).replace(/\\/g, '/');
      }

      expect(createResult('./test')).to.contain('/projects/a/test');
      expect(createResult('~/test')).to.contain('/test');
      expect(createResult('/test')).to.length.lessThan(10);
    });
  });
});
