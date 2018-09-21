import joi from 'joi';

const schema = joi.object().keys({
  enabled: joi.bool().required()
});

export default function(
  config,
  {
    addLocation,
    VALIDATE_OPTIONS
  }
) {
  const validationErrors = joi.validate(config.swarm, schema, VALIDATE_OPTIONS);

  return addLocation(validationErrors, 'swarm');
}
