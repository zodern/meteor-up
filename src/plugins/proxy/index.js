import * as _commands from './commands';
import validator from './validate';

export const description = 'Setup and manage reverse proxy and ssl';

export const commands = _commands;

export const validate = {
  proxy: validator
};

export const hooks = {
  'pre.meteor.envconfig'(api) {
    const config = api.getConfig();
    const appConfig = config.app;
    const proxyConfig = config.proxy;

    if (!appConfig || !appConfig.env || !proxyConfig) {
      return;
    }

    appConfig.env['VIRTUAL_HOST'] = proxyConfig.domains;
    appConfig.env['HTTPS_METHOD'] = 'noredirect';
    
    if (proxyConfig.ssl && proxyConfig.ssl.letsEncryptEmail) {
      appConfig.env['LETSENCRYPT_HOST'] = proxyConfig.domains;
      appConfig.env['LETSENCRYPT_EMAIL'] = proxyConfig.ssl.letsEncryptEmail;
    }

    api.setConfig({
      ...config,
      app: {
        ...appConfig
      }
    });
  }
};
