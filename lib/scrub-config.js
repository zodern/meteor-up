'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utils = exports._configScrubbers = undefined;
exports.registerScrubber = registerScrubber;
exports.scrubConfig = scrubConfig;

var _lodash = require('lodash');

var _url = require('url');

var _configScrubbers = exports._configScrubbers = [];

function registerScrubber(scrubber) {
  _configScrubbers.push(scrubber);
}

var utils = exports.utils = {
  scrubUrl: function scrubUrl(url) {
    var _parse = (0, _url.parse)(url),
        protocol = _parse.protocol,
        auth = _parse.auth,
        hostname = _parse.hostname,
        port = _parse.port,
        path = _parse.path,
        hash = _parse.hash;

    var href = protocol + '//';

    if (auth) {
      href += 'user:pass@';
    }

    var domains = hostname.split('.');
    domains.pop();
    domains.pop();
    domains.forEach(function () {
      href += 'subdomain.';
    });
    href += 'host.com';

    if (port) {
      href += ':' + port;
    }

    if (path && path !== '/') {
      href += path;
    }
    if (hash) {
      href += hash;
    }

    return href;
  }
};

function scrubConfig(_config) {
  var config = (0, _lodash.cloneDeep)(_config);
  _configScrubbers.forEach(function (scrubber) {
    config = scrubber(config, utils);
  });
  return config;
}
//# sourceMappingURL=scrub-config.js.map