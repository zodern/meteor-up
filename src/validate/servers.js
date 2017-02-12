import { combineErrorDetails } from './utils';
import joi from 'joi';

const schema = joi.object().keys({
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
});

export default function validateServers(servers) {
  let details = [];
  Object.keys(servers).forEach(key => {
    let result = joi.validate(servers[key], schema, {
      convert: false
    });
    details = combineErrorDetails(details, result);
  });
  return details;
}
