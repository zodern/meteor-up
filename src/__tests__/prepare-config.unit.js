import { _configPreps, registerPreparer, runConfigPreps } from '../prepare-config';
import { expect } from 'chai';

describe('prepare-config', () => {
  beforeEach(() => {
    _configPreps.length = 0;
  });

  it('should register preparers', () => {
    const preparer = function() {};
    registerPreparer(preparer);
    expect(_configPreps[0]).to.equal(preparer);
  });

  it('should run config preps', () => {
    const preparer = function(config) {
      expect(config).to.be.an('object');
      config.ran = true;

      return config;
    };

    registerPreparer(preparer);

    const config = runConfigPreps({ran: false});
    expect(config).to.deep.equal({ran: true});
  });
});
