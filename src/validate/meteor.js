import {
  VALIDATE_OPTIONS,
  addLocation,
  combineErrorDetails,
  serversExist
} from './utils';

import joi from 'joi';

const schema = joi.object().keys({
  name: joi.string().min(1).required(),
  path: joi.string().min(1).required(),
  port: joi.number(),
  servers: joi.object().required(),
  deployCheckWaitTime: joi.number(),
  deployCheckPort: joi.number(),
  enableUploadProgressBar: joi.bool(),
  dockerImage: joi.string(),
  docker: joi.object().keys({
    image: joi.string().trim(),
    imagePort: joi.number(),
    imageFrontendServer: joi.string(),
    args: joi.array().items(joi.string().label('docker.args array items')),
    bind: joi.string().trim(),
    networks: joi
      .array()
      .items(joi.string().label('docker.networks array items'))
  }),
  buildOptions: joi.object().keys({
    serverOnly: joi.bool(),
    debug: joi.bool(),
    cleanAfterBuild: joi.bool(),
    buildLocation: joi.string(),
    mobileSettings: joi.object(),
    server: joi.string().uri(),
    allowIncompatibleUpdates: joi.boolean(),
    executable: joi.string()
  }),
  env: joi
    .object()
    .keys({
      ROOT_URL: joi
        .string()
        .regex(
          new RegExp('^(http|https)://', 'i'),
          'valid url with "http://" or "https://"'
        )
        .required(),
      MONGO_URL: joi.string()
    })
    .pattern(/[\s\S]*/, [joi.string(), joi.number()]),
  log: joi.object().keys({
    driver: joi.string(),
    opts: joi.object()
  }),
  volumes: joi.object(),
  nginx: joi.object().keys({
    clientUploadLimit: joi.string().trim()
  }),
  ssl: joi
    .object()
    .keys({
      autogenerate: joi
        .object()
        .keys({
          email: joi.string().email().required(),
          domains: joi.string().required()
        })
        .label('autogenerate'),
      crt: joi.string().trim(),
      key: joi.string().trim(),
      port: joi.number(),
      upload: joi.boolean()
    })
    .and('crt', 'key')
    .without('autogenerate', ['crt', 'key'])
    .or('crt', 'autogenerate')
});

export default function(config) {
  let details = [];
  details = combineErrorDetails(
    details,
    joi.validate(config.meteor, schema, VALIDATE_OPTIONS)
  );
  if (config.meteor.name.indexOf(' ') > -1) {
    details.push({
      message: '"name" has a space'
    });
  }
  if (
    typeof config.meteor.ssl === 'object' &&
    'autogenerate' in config.meteor.ssl &&
    'PORT' in config.meteor.env
  ) {
    details.push({
      message: 'PORT can not be set when using ssl.autogenerate',
      path: 'env'
    });
  }
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.meteor.servers)
  );

  return addLocation(details, 'meteor');
}
