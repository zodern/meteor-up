import { _configScrubbers, registerScrubber, scrubConfig, utils } from '../scrub-config';
import { expect } from 'chai';

describe('scrub-config', () => {
  beforeEach(() => {
    _configScrubbers.length = 0;
  });

  it('should register scrubbers', () => {
    const scrubber = function() { };

    registerScrubber(scrubber);
    expect(_configScrubbers[0]).to.equal(scrubber);
  });

  it('should run scrubbers', () => {
    const scrubber = function(config, scrubUtils) {
      expect(config).to.be.an('object');
      expect(scrubUtils).to.equal(utils);

      config.ran = true;

      return config;
    };

    registerScrubber(scrubber);
    const config = { ran: false };
    const result = scrubConfig(config);
    expect(result).to.not.equal(config);
    expect(result).to.deep.equal({ ran: true });
  });
  describe('utils.scrubUrl', () => {
    it('should change host and keep protocol and port', () => {
      const url = 'https://meteor-up.com';
      const expected = 'https://host.com';

      expect(utils.scrubUrl(url)).to.equal(expected);
    });
    it('should change auth', () => {
      const url = 'https://abc:123@meteor-up.com';
      const expected = 'https://user:pass@host.com';

      expect(utils.scrubUrl(url)).to.equal(expected);
    });
    it('should keep port, path, and hash', () => {
      const url = 'https://meteor-up.com:3000/docs#plugins';
      const expected = 'https://host.com:3000/docs#plugins';

      expect(utils.scrubUrl(url)).to.equal(expected);
    });
    it('should change subdomains', () => {
      const url = 'https://abc.xyz.meteor-up.com';
      const expected = 'https://subdomain.subdomain.host.com';

      expect(utils.scrubUrl(url)).to.equal(expected);
    });
  });
});
