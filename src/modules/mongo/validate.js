import joi from 'joi';

const schema = joi.object().keys({
  // TODO: mongo.oplog is unused, but was part of the example config.
  // decide what to do with it
  oplog: joi.bool(),
  port: joi.number(),
  version: joi.string(),
  servers: joi.object().keys()
});

export default function(
    config,
    {
      combineErrorDetails,
      serversExist,
      addLocation,
      VALIDATE_OPTIONS
   }
  ) {
  let details = [];

  let validationErrors = joi.validate(config.mongo, schema, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, validationErrors);
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.mongo.servers)
  );
  return addLocation(details, 'mongo');
}
