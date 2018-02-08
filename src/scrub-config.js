import { cloneDeep } from 'lodash';
import { parse } from 'url';

export const _configScrubbers = [];

export function registerScrubber(scrubber) {
  _configScrubbers.push(scrubber);
}

export const utils = {
  scrubUrl(url) {
    const {
      protocol,
      auth,
      hostname,
      port,
      path,
      hash
    } = parse(url);

    let href = `${protocol}//`;

    if (auth) {
      href += 'user:pass@';
    }

    const domains = hostname.split('.');
    domains.pop();
    domains.pop();
    domains.forEach(() => {
      href += 'subdomain.';
    });
    href += 'host.com';

    if (port) {
      href += `:${port}`;
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

export function scrubConfig(_config) {
  let config = cloneDeep(_config);
  _configScrubbers.forEach(scrubber => {
    config = scrubber(config, utils);
  });

  return config;
}
