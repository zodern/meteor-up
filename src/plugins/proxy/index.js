import * as _commands from './commands';

import validator from './validate';

export const description = 'Setup and manage reverse proxy and ssl';

export const commands = _commands;

export const validate = {
  proxy: validator
};

export function prepareConfig(config) {
  if (!config.app || !config.proxy) {
    return config;
  }

  config.app.env = config.app.env || {};

  config.app.env['VIRTUAL_HOST'] = config.proxy.domains;
  config.app.env['HTTPS_METHOD'] = config.proxy.ssl && config.proxy.ssl.forceSSL ? 'redirect' : 'noredirect';

  if (config.proxy.ssl && config.proxy.ssl.letsEncryptEmail) {
    config.app.env['LETSENCRYPT_HOST'] = config.proxy.domains;
    config.app.env['LETSENCRYPT_EMAIL'] = config.proxy.ssl.letsEncryptEmail;
  }

  return config;
}
