import {
  VALIDATE_OPTIONS,
  addLocation,
  combineErrorDetails,
  serversExist
} from './utils';

import joi from 'joi';

const schema = joi.object().keys({
  oplog: joi.bool(),
  port: joi.number(),
  version: joi.string(),
  servers: joi.object().keys(),
  ipwhitelist: joi.array()
});

export default function(config) {
  let details = [];
  let validationErrors = joi.validate(config.mongo, schema, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, validationErrors);
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.mongo.servers)
  );
  return addLocation(details, 'mongo');
}
