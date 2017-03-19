import { VALIDATE_OPTIONS, addLocation, combineErrorDetails } from './utils';

import joi from 'joi';

// The regexp used matches everything
const schema = joi.object().keys().pattern(/.*/, {
  host: joi
    .alternatives(
      joi.string().ip({
        version: ['ipv4', 'ipv6']
      }),
      joi.string().uri(),
      joi.string().trim()
    )
    .required(),
  username: joi.string().required(),
  pem: joi.string().trim(),
  password: joi.string(),
  opts: joi.object().keys({
    port: joi.number()
  })
}).min(1);

export default function validateServers(servers) {
  let details = [];
  let result = joi.validate(servers, schema, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, result);
  return addLocation(details, 'servers');
}
