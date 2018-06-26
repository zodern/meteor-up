import joi from 'joi';

const schema = joi.object().keys({
  ssl: joi
    .object()
    .keys({
      letsEncryptEmail: joi.string().trim(),
      crt: joi.string().trim(),
      key: joi.string().trim(),
      forceSSL: joi.bool()
    })
    .and('crt', 'key')
    .without('letsEncryptEmail', ['crt', 'key'])
    .or('letsEncryptEmail', 'crt', 'forceSSL'),
  domains: joi.string().required(),
  nginxServerConfig: joi.string(),
  volumes: joi.object(),
  nginxLocationConfig: joi.string(),
  clientUploadLimit: joi.string(),
  shared: joi.object().keys({
    clientUploadLimit: joi.alternatives().try(joi.number(), joi.string()),
    httpPort: joi.number(),
    httpsPort: joi.number(),
    nginxConfig: joi.string(),
    env: joi
      .object()
      .pattern(/[\s\S]*/, [joi.string(), joi.number(), joi.boolean()]),
    envLetsEncrypt: joi
      .object()
      .keys({
        ACME_CA_URI: joi.string().regex(new RegExp('^(http|https)://', 'i')),
        DEBUG: joi.boolean(),
        NGINX_PROXY_CONTAINER: joi.string()
      })
      .pattern(/[\s\S]*/, [joi.string(), joi.number(), joi.boolean()])
  })
});

export default function(config, {
  addDepreciation,
  combineErrorDetails,
  VALIDATE_OPTIONS,
  addLocation
}) {
  let details = [];
  details = combineErrorDetails(
    details,
    joi.validate(config.proxy, schema, VALIDATE_OPTIONS)
  );
  if (
    config.app &&
    config.app.env &&
    config.app.env.PORT &&
    config.app.env.PORT !== 80
  ) {
    details.push({
      message: 'app.env.PORT is ignored when using the reverse proxy',
      path: ''
    });
  }

  if (config.proxy.shared && config.proxy.shared.clientUploadLimit) {
    details = addDepreciation(
      details,
      'shared.clientUploadLimit',
      'Use proxy.clientUploadLimit instead',
      'https://git.io/vN5tn'
    );
  }

  return addLocation(details, 'proxy');
}
