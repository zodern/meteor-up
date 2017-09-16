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

export function prepareConfig(config) {
  if (!config.app) {
    return config;
  }

  config.app.docker = config.app.docker || {};
  config.app.docker.image = config.app.docker.image || config.app.dockerImage || 'kadirahq/meteord';
  delete config.app.dockerImage;
  return config;
}

function meteorEnabled(api) {
  const config = api.getConfig();
  if (config.app && config.app.type === 'meteor') {
    return true;
  }
  return false;
}

export let hooks = {
  'post.default.setup'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.setup');
    }
  },
  'post.default.deploy'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.deploy');
    }
  },
  'post.default.start'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.start');
    }
  },
  'post.default.stop'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.stop');
    }
  },
  'post.default.logs'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.logs');
    }
  },
  'post.default.reconfig'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.envconfig')
        .then(() => api.runCommand('meteor.start'));
    }
  },
  'post.default.restart'(api) {
    if (meteorEnabled(api)) {
      return api.runCommand('meteor.restart');
    }
  }
};
