export const _optionFunctions = [];

export function registerSwarmOptions(optionFunction) {
  _optionFunctions.push(optionFunction);
}

function mergeLabels(current, additional) {
  return additional.reduce((result, label) => {
    label.servers.forEach(server => {
      result[server] = {
        ...result[server] || {},
        [label.name]: label.value
      };
    });

    return result;
  }, current);
}

export function getOptions(config) {
  return _optionFunctions.reduce((result, optionFunction) => {
    const { labels, managers } = optionFunction(config) || {};

    if (labels instanceof Array) {
      result.labels = mergeLabels(result.labels, labels);
    }

    if (managers) {
      result.managers.push(...managers);
    }

    return result;
  }, { labels: {}, managers: [] });
}
