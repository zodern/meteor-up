import * as utils from './utils';
const { combineErrorDetails, VALIDATE_OPTIONS, improveErrors } = utils;
import chalk from 'chalk';
import joi from 'joi';
import validateServer from './servers';

export const _pluginValidators = {};

export function addPluginValidator(rootPath, handler) {
  _pluginValidators[rootPath] = handler;
}

function generateSchema() {
  const topLevelKeys = {
    servers: joi.object(),
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
  const errors = [];
  const depreciations = [];

  validateAll(config).forEach(problem => {
    if (problem.type === 'depreciation') {
      depreciations.push(problem);
    } else {
      errors.push(problem);
    }
  });

  return {
    errors: errors.map(error => error.message),
    depreciations: depreciations.map(depreciation => depreciation.message)
  };
}

export function showErrors(errors) {
  const lines = [];
  const plural = errors.length > 1 ? 's' : '';

  lines.push(`${errors.length} Validation Error${plural}`);

  errors.forEach(error => {
    lines.push(`  - ${error}`);
  });

  lines.push('');

  console.log(chalk.red(lines.join('\n')));
}

export function showDepreciations(depreciations) {
  const lines = [];
  const plural = depreciations.length > 1 ? 's' : '';

  lines.push(`${depreciations.length} Depreciation${plural}`);

  depreciations.forEach(depreciation => {
    lines.push(`  - ${depreciation}`);
  });

  lines.push('');

  console.log(chalk.yellow(lines.join('\n')));
}
