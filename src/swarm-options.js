import { merge } from 'lodash';
export const _optionFunctions = [];

export function registerSwarmOptions(optionFunction) {
  _optionFunctions.push(optionFunction);
}

export function getOptions(config) {
  return _optionFunctions.reduce((result, optionFunction) => {
    const { labels, managers } = optionFunction(config) || {};

    if (typeof labels === 'object') {
      Object.keys(labels).forEach(host => {
        result.labels[host] = merge(result.labels[host] || {}, labels[host]);
      });
    }

    if (managers) {
      result.managers.push(...managers);
    }

    return result;
  }, { labels: {}, managers: [] });
}
