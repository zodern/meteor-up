export const _configPreps = [];

export function registerPreparer(preparer) {
  _configPreps.push(preparer);
}

export function runConfigPreps(_config, api) {
  let config = _config;

  _configPreps.forEach(preparer => {
    config = preparer(config, api) || config;
  });

  return config;
}
