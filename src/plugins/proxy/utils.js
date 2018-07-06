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
