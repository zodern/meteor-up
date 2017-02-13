import { combineErrorDetails, improveErrors } from './utils';

import joi from 'joi';
import validateMeteor from './meteor';
import validateMongo from './mongo';
import validateServer from './servers';

const schema = joi.object().keys({
  servers: joi.object(),
  meteor: joi.object(),
  mongo: joi.object()
});

function validateAll(config) {
  let details = [];
  let results;

  results = joi.validate(config, schema);
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

  return details.map(improveErrors);
}

export default function validate(config) {
  let errors = validateAll(config);
  return {
    errors: errors.reduce((result, error) => {
      if (!error.warning) {
        result.push(error.message);
      }
      return result;
    }, []),
    warnings: errors.reduce((result, error) => {
      if (error.warning) {
        result.push(error.message);
      }
      return result;
    }, []),
    hasErrors: errors.reduce((result, error) => {
      if (error.warning !== true) {
        return true;
      }
      return false;
    }, false)
  };
}
