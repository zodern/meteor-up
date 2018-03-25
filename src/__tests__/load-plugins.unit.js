import modules, { locatePluginDir } from '../load-plugins';
import { expect } from 'chai';

describe('load-plugins', () => {
  it('should load included plugins', () => {
    expect(Object.keys(modules)).to.have.length.greaterThan(4);
    expect(Object.keys(modules)).to.contain('default');
  });

  describe('locatePluginDir', () => {
    it('should identify paths', () => {
      const configPath = '/projects/test/mup.js';

      expect(locatePluginDir('./test', configPath)).to.equal('/projects/test/test');
      expect(locatePluginDir('~/test', configPath)).to.contain('/test');
      expect(locatePluginDir('/test', configPath)).to.equal('/test');
    });
  });
});
