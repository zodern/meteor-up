import * as _commands from './commands';
import _validator from './validate';
import traverse from 'traverse';

export const description = 'Deploy and manage meteor apps';

export const commands = _commands;

export const validate = {
  meteor: _validator,
  app(config, utils) {
    if (typeof config.meteor === 'object' || (config.app && config.app.type !== 'meteor')) {
      // The meteor validator will check the config
      // Or the config is telling a different app to handle deployment
      return [];
    }

    return _validator(config, utils);
  }
};

export function prepareConfig(config) {
  if (!config.app || config.app.type !== 'meteor') {
    return config;
  }

  config.app.docker = config.app.docker || {};
  config.app.docker.image = config.app.docker.image || config.app.dockerImage || 'kadirahq/meteord';
  delete config.app.dockerImage;

  return config;
}

function meteorEnabled(api) {
  const config = api.getConfig();

  return config.app && config.app.type === 'meteor';
}

function onlyMeteorEnabled(...commandNames) {
  return function(api) {
    let index = 0;

    function thenHandler() {
      index += 1;
      if (commandNames.length > index) {
        return api.runCommand(commandNames[index]).then(thenHandler);
      }
    }

    if (meteorEnabled(api)) {
      return api.runCommand(commandNames[index]).then(thenHandler);
    }
  };
}

export const hooks = {
  'post.default.setup': onlyMeteorEnabled('meteor.setup'),
  'post.default.deploy': onlyMeteorEnabled('meteor.deploy'),
  'post.default.start': onlyMeteorEnabled('meteor.start'),
  'post.default.stop': onlyMeteorEnabled('meteor.stop'),
  'post.default.logs': onlyMeteorEnabled('meteor.logs'),
  'post.default.reconfig': onlyMeteorEnabled('meteor.envconfig', 'meteor.start'),
  'post.default.restart': onlyMeteorEnabled('meteor.restart'),
  'post.default.status': onlyMeteorEnabled('meteor.status')
};

export function scrubConfig(config, utils) {
  if (config.meteor) {
    delete config.meteor;
  }

  if (config.app) {
    // eslint-disable-next-line
    config.app = traverse(config.app).map(function () {
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

export function swarmOptions(config) {
  if (config && config.app && config.app.type === 'meteor') {
    return {
      labels: Object.keys(config.app.servers).reduce((result, server) => {
        result[server] = {
          [`mup-app-${config.app.name}`]: 'true'
        };

        return result;
      }, {})
    };
  }
}
