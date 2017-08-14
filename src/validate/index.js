import * as utils from './utils';

import joi from 'joi';
import validateServer from './servers';

const { combineErrorDetails, VALIDATE_OPTIONS, improveErrors } = utils;

export const _pluginValidators = {};

export function addPluginValidator(rootPath, handler) {
  _pluginValidators[rootPath] = handler;
}

function generateSchema() {
  const topLevelKeys = {
    servers: joi.object().required(),
    app: joi.object(),
    plugins: joi.array(),
    hooks: joi.object().pattern(/.*/, joi.alternatives(joi.object({
      localCommand: joi.string(),
      remoteCommand: joi.string(),
      method: joi.func()
    }),
    joi.func()
  ))
  };

  Object.keys(_pluginValidators).forEach(key => {
    topLevelKeys[key] = joi.any();
  });

  return joi.object().keys(topLevelKeys);
}

function validateAll(config) {
  let details = [];
  let results;

  results = joi.validate(config, generateSchema(), VALIDATE_OPTIONS);
  details = combineErrorDetails(details, results);

  if (config.servers) {
    results = validateServer(config.servers);
    details = combineErrorDetails(details, results);
  }

  for (const [property, validator] of Object.entries(_pluginValidators)) {
    if (config[property] !== undefined) {
      results = validator(config, utils);
      details = combineErrorDetails(details, results);
    }
  }

  return details.map(improveErrors);
}

export default function validate(config) {
  let errors = validateAll(config);
  return errors.map(error => {
    return error.message;
  });
}
