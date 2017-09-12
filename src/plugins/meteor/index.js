import * as _commands from './commands';
import _validator from './validate';

export const description = 'Deploy and manage meteor apps';

export let commands = _commands;

export const validate = {
  meteor: _validator,
  app(config, utils) {
    if (typeof config.meteor === 'object') {
      // The meteor validator will check the config
      return [];
    }
    return _validator(config, utils);
  }
};

export function prepareConfig (config) {
  config.app.docker = config.app.docker || {};
  config.app.docker.image = config.app.docker.image || config.app.dockerImage || 'kadirahq/meteord';
  delete config.app.dockerImage;
  return config;
}

export let hooks = {
  'post.default.setup'(api) {
    const config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runCommand('meteor.setup');
    }
  },
  'post.default.deploy'(api) {
    const config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runCommand('meteor.deploy');
    }
  }
};
