import joi from '@hapi/joi';

const swarmSchema = joi.object().keys({
  enabled: joi.bool().required(),
  labels: joi.array().items(joi.object().keys({
    name: joi.string().required(),
    value: joi.string().required(),
    servers: joi.array().items(joi.string())
  }))
});

const registrySchema = joi.object().keys({
  host: joi.string().required(),
  imagePrefix: joi.string(),
  username: joi.string(),
  password: joi.string()
});

export function validateSwarm(
  config,
  {
    addLocation,
    VALIDATE_OPTIONS,
    combineErrorDetails
  }
) {
  let details = [];

  details = combineErrorDetails(
    details,
    joi.validate(config.swarm, swarmSchema, VALIDATE_OPTIONS)
  );

  return addLocation(details, 'swarm');
}

export function validateRegistry(
  config,
  {
    addLocation,
    VALIDATE_OPTIONS,
    combineErrorDetails
  }
) {
  let details = [];
  details = combineErrorDetails(
    details,
    joi.validate(config.privateDockerRegistry, registrySchema, VALIDATE_OPTIONS)
  );

  return addLocation(details, 'dockerPrivateRegistry');
}
