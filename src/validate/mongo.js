import { addLocation, combineErrorDetails, serversExist } from './utils';

import joi from 'joi';

const schema = joi.object().keys({
  oplog: joi.bool(),
  port: joi.number(),
  version: joi.string(),
  servers: joi.object().keys()
});

export default function(config) {
  let details = [];
  details = combineErrorDetails(details, joi.validate(config.mongo, schema));
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.mongo.servers)
  );
  return addLocation(details, 'mongo');
}
