import joi from '@hapi/joi';

const schema = joi.object().keys({
  name: joi.string().min(1).required(),
  path: joi.string().min(1).required(),
  port: joi.number(),
  type: joi.string(),
  servers: joi.object().min(1).required().pattern(
    /[/s/S]*/,
    joi.object().keys({
      env: joi.object().pattern(
        /[/s/S]*/,
        [joi.string(), joi.number(), joi.bool()]
      ),
      bind: joi.string(),
      settings: joi.string()
    })
  ),
  deployCheckWaitTime: joi.number(),
  deployCheckPort: joi.number(),
  enableUploadProgressBar: joi.bool(),
  dockerImage: joi.string(),
  docker: joi.object().keys({
    image: joi.string().trim(),
    imagePort: joi.number(),
    imageFrontendServer: joi.string(),
    args: joi.array().items(joi.string()),
    bind: joi.string().trim(),
    prepareBundle: joi.bool(),
    prepareBundleLocally: joi.bool(),
    buildInstructions: joi.array().items(joi.string()),
    stopAppDuringPrepareBundle: joi.bool(),
    useBuildKit: joi.bool(),
    networks: joi
      .array()
      .items(joi.string())
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
    .pattern(/[\s\S]*/, [joi.string(), joi.number(), joi.bool()]),
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
        }),
      crt: joi.string().trim(),
      key: joi.string().trim(),
      port: joi.number(),
      upload: joi.boolean()
    })
    .and('crt', 'key')
    .without('autogenerate', ['crt', 'key'])
    .or('crt', 'autogenerate')
});

export default function(
  config,
  {
    addDepreciation,
    combineErrorDetails,
    VALIDATE_OPTIONS,
    serversExist,
    addLocation
  }
) {
  let details = [];

  details = combineErrorDetails(
    details,
    joi.validate(config.app, schema, VALIDATE_OPTIONS)
  );
  if (config.app.name && config.app.name.indexOf(' ') > -1) {
    details.push({
      message: 'has a space',
      path: 'name'
    });
  }
  if (
    typeof config.app.ssl === 'object' &&
    'autogenerate' in config.app.ssl &&
    'PORT' in config.app.env
  ) {
    details.push({
      message: 'PORT can not be set when using ssl.autogenerate',
      path: 'env'
    });
  }
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.app.servers)
  );

  // Depreciations
  if (config.app.ssl) {
    details = addDepreciation(
      details,
      'ssl',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  if (config.app.nginx) {
    details = addDepreciation(
      details,
      'nginx',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  if (config.app.docker && config.app.docker.imageFrontendServer) {
    details = addDepreciation(
      details,
      'docker.imageFrontendServer',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  return addLocation(details, config.meteor ? 'meteor' : 'app');
}
