import { union } from 'lodash';
export const _optionFunctions = [];

export function registerSwarmOptions(optionFunction) {
  _optionFunctions.push(optionFunction);
}

export function getOptions(config) {
  return _optionFunctions.reduce((result, optionFunction) => {
    const { tags, managers } = optionFunction(config) || {};

    if (tags) {
      Object.keys(tags).forEach(tag => {
        result.tags[tag] = result.tags[tag] || [];
        result.tags[tag] = union(result.tags[tag], tags[tag]);
      });
    }

    if (managers) {
      result.managers.push(...managers);
    }

    return result;
  }, { tags: {}, managers: [] });
}
