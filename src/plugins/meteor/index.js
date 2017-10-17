import * as _commands from './commands';
import _validator from './validate';
import traverse from 'traverse';

export const description = 'Deploy and manage meteor apps';

export const commands = _commands;

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

export const hooks = {
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

export function scrubConfig(config, utils) {
  if (config.meteor) {
    delete config.meteor;
  }

  if (config.app) {
    // eslint-disable-next-line
    config.app = traverse(config.app).map(function() {
      const path = this.path.join('.');

      switch (path) {
        case 'name':
          return this.update('my-app');
        case 'buildOptions.server':
          return this.update(utils.scrubUrl(this.node));

        case 'env.ROOT_URL':
          return this.update(utils.scrubUrl(this.node));

        case 'env.MONGO_URL':
          if (config.mongo) {
            const url = this.node.split('/');
            url.pop();
            url.push('my-app');

            return this.update(url.join('/'));
          }

          return this.update(utils.scrubUrl(this.node));

        // no default
      }
    });
  }

  return config;
}
