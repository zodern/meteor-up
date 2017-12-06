'use strict';

var _scrubConfig = require('../scrub-config');

var _chai = require('chai');

describe('scrub-config', function () {
  beforeEach(function () {
    _scrubConfig._configScrubbers.length = 0;
  });

  it('should register scrubbers', function () {
    var scrubber = function scrubber() {};
    (0, _scrubConfig.registerScrubber)(scrubber);
    (0, _chai.expect)(_scrubConfig._configScrubbers[0]).to.equal(scrubber);
  });

  it('should run scrubbers', function () {
    var scrubber = function scrubber(config, scrubUtils) {
      (0, _chai.expect)(config).to.be.an('object');
      (0, _chai.expect)(scrubUtils).to.equal(_scrubConfig.utils);

      config.ran = true;
      return config;
    };

    (0, _scrubConfig.registerScrubber)(scrubber);
    var config = { ran: false };
    var result = (0, _scrubConfig.scrubConfig)(config);
    (0, _chai.expect)(result).to.not.equal(config);
    (0, _chai.expect)(result).to.deep.equal({ ran: true });
  });
  describe('utils.scrubUrl', function () {
    it('should change host and keep protocol and port', function () {
      var url = 'https://meteor-up.com';
      var expected = 'https://host.com';

      (0, _chai.expect)(_scrubConfig.utils.scrubUrl(url)).to.equal(expected);
    });
    it('should change auth', function () {
      var url = 'https://abc:123@meteor-up.com';
      var expected = 'https://user:pass@host.com';

      (0, _chai.expect)(_scrubConfig.utils.scrubUrl(url)).to.equal(expected);
    });
    it('should keep port, path, and hash', function () {
      var url = 'https://meteor-up.com:3000/docs#plugins';
      var expected = 'https://host.com:3000/docs#plugins';

      (0, _chai.expect)(_scrubConfig.utils.scrubUrl(url)).to.equal(expected);
    });
    it('should change subdomains', function () {
      var url = 'https://abc.xyz.meteor-up.com';
      var expected = 'https://subdomain.subdomain.host.com';

      (0, _chai.expect)(_scrubConfig.utils.scrubUrl(url)).to.equal(expected);
    });
  });
});
//# sourceMappingURL=scrub-config.unit.js.map