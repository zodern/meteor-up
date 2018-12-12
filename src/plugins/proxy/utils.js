export function getSessions(api) {
  const proxyConfig = api.getConfig().proxy;

  if (proxyConfig.servers) {
    return api.getSessions(['proxy']);
  }

  return api.getSessions(['app']);
}

export function addProxyEnv(config, env) {
  const sslConfig = config.proxy.ssl;

  env.VIRTUAL_HOST = config.proxy.domains;
  env.HTTPS_METHOD = sslConfig && sslConfig.forceSSL ? 'redirect' : 'noredirect';

  if (sslConfig && sslConfig.letsEncryptEmail) {
    env.LETSENCRYPT_HOST = config.proxy.domains;
    config.app.env.LETSENCRYPT_EMAIL = sslConfig.letsEncryptEmail;
  }

  return env;
}

export function normalizeUrl(config, env) {
  const _config = config;
  const sslConfig = config.proxy.ssl;
  const isHttpUrl = new RegExp('^(http)://', 'i').test(env.ROOT_URL);

  if (sslConfig && isHttpUrl) {
    const urlArray = _config.app.env.ROOT_URL.split(':');

    urlArray[0] = `${urlArray[0]}s:`;
    _config.app.env.ROOT_URL = urlArray.join('');
  }

  return _config.app.env.ROOT_URL;
}
