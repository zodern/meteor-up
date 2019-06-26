import joi from 'joi';

const schema = joi.object().keys({
  enabled: joi.bool().required(),
  labels: joi.array().items(joi.object().keys({
    name: joi.string().required(),
    value: joi.string().required(),
    servers: joi.array().items(joi.string())
  }))
});

export default function(
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
    joi.validate(config.swarm, schema, VALIDATE_OPTIONS)
  );

  return addLocation(details, 'swarm');
}
