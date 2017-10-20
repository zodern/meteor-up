export const _optionFunctions = [];

export function registerSwarmOptions(optionFunction) {
  _optionFunctions.push(optionFunction);
}

export function getOptions(config) {
  return _optionFunctions.reduce((result, optionFunction) => {
    const { tags, managers } = optionFunction(config) || {};

    if (tags) {
      Object.keys(tags).forEach(host => {
        result.tags[host] = result.tags[host] || [];
        result.tags[host].push(...tags[host]);
      });
    }

    if (managers) {
      result.managers.push(...managers);
    }

    return result;
  }, { tags: {}, managers: [] });
}
