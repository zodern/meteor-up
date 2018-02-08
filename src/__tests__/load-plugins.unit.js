import modules, { locatePluginDir } from '../load-plugins';
import { expect } from 'chai';

describe('load-plugins', () => {
  it('should load included plugins', () => {
    expect(Object.keys(modules)).to.have.length.greaterThan(4);
    expect(Object.keys(modules)).to.contain('default');
  });

  describe('locatePluginDir', () => {
    it('should identify paths', () => {
      expect(locatePluginDir('./test')).to.equal('./test');
      expect(locatePluginDir('~/test')).to.equal('~/test');
      expect(locatePluginDir('/test')).to.equal('/test');
    });
  });
});
