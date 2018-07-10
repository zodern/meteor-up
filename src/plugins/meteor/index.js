import * as _commands from './commands';
import _validator from './validate';
import { defaultsDeep } from 'lodash';
import traverse from 'traverse';

export const description = 'Deploy and manage meteor apps';

export const commands = _commands;

export const validate = {
  meteor: _validator,
  app(config, utils) {
    if (typeof config.meteor === 'object' || (config.app && config.app.type !== 'meteor')) {
      // The meteor validator will check the config
      // Or the config is telling a different plugin to handle deployment
      return [];
    }

    return _validator(config, utils);
  }
};

export function prepareConfig(config) {
  if (!config.app || config.app.type !== 'meteor') {
    return config;
  }

  config.app.docker = defaultsDeep(config.app.docker, {
    image: config.app.dockerImage || 'kadirahq/meteord',
    stopAppDuringPrepareBundle: true
  });

  delete config.app.dockerImage;

  // If imagePort is not set, use port 3000 to simplify using
  // images that run the app with a non-root user.
  // Port 80 was the traditional port used by kadirahq/meteord
  // and meteorhacks/meteord, but they allow the PORT env
  // variable to override it.
  config.app.docker.imagePort = config.app.docker.imagePort || 3000;

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
    const label = {
      name: `mup-app-${config.app.name}`,
      value: 'true',
      servers: Object.keys(config.app.servers)
    };

    return {
      labels: [label]
    };
  }
}
