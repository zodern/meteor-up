import { VALIDATE_OPTIONS, combineErrorDetails, improveErrors } from './utils';

import joi from 'joi';
import validateMeteor from './meteor';
import validateMongo from './mongo';
import validateServer from './servers';
import validateProxy from './proxy';

const schema = joi.object().keys({
  servers: joi.object().required(),
  meteor: joi.object(),
  mongo: joi.object(),
  proxy: joi.object()
});

function validateAll(config) {
  let details = [];
  let results;

  results = joi.validate(config, schema, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, results);

  if (config.servers) {
    results = validateServer(config.servers);
    details = combineErrorDetails(details, results);
  }

  if (config.mongo) {
    results = validateMongo(config);
    details = combineErrorDetails(details, results);
  }

  if (config.meteor) {
    results = validateMeteor(config);
    details = combineErrorDetails(details, results);
  }

  if (config.proxy) {
    results = validateProxy(config);
    details = combineErrorDetails(details, results);
  }

  return details.map(improveErrors);
}

export default function validate(config) {
  let errors = validateAll(config);
  return errors.map((error) => {
    return error.message;
  });
}
