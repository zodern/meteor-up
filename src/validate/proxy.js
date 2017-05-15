import {
  VALIDATE_OPTIONS,
  addLocation,
  combineErrorDetails,
  serversExist
} from './utils';

import joi from 'joi';

const schema = joi.object().keys({
  servers: joi.object().required(),
  ssl: joi.object(),
  domains: joi.string().required(),
  clientUploadLimit: joi.number(),
  shared: joi.object().keys({
    httpPort: joi.number(),
    httpsPort: joi.number(),
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

export default function(config) {
  let details = [];
  details = combineErrorDetails(
    details,
    joi.validate(config.proxy, schema, VALIDATE_OPTIONS)
  );
  if (config.proxy.servers) {
    details = combineErrorDetails(
      details,
      serversExist(config.servers, config.proxy.servers)
    );
  }
  return addLocation(details, 'proxy');
}
