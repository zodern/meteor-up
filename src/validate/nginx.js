/**
 * @author Shai Amir
 */

import { addLocation, combineErrorDetails, serversExist } from './utils';

import joi from 'joi';

const schema = joi.object().keys({
  name: joi.string().min(1).required(),
  httpPort: joi.number(),
  httpsPort: joi.number(),
  clientUploadLimit: joi.number(),
  env: joi
    .object()
    .keys({
      DEFAULT_HOST: joi.string()
    })
    .pattern(/[\s\S]*/, [joi.string(), joi.number(), joi.boolean()]),
  env: joi
    .object()
    .keys({
      ACME_CA_URI: joi
        .string()
        .regex(new RegExp('^(http|https)://', 'i')),
      DEBUG: joi.boolean(),
      NGINX_PROXY_CONTAINER: joi.string()
    })
    .pattern(/[\s\S]*/, [joi.string(), joi.number(), joi.boolean()]),
  servers: joi.object().required()
});

export default function(config) {
  let details = [];
  details = combineErrorDetails(details, joi.validate(config.nginx, schema));
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.nginx.servers)
  );
  return addLocation(details, 'nginx');
}
