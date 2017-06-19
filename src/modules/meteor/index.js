import * as _commands from './commands';
import * as _tasks from './tasks';

export const description = 'Deploy and manage meteor apps';

export let commands = _commands;
export let tasks = _tasks;

export let hooks = {
  'post.default.setup'(api) {
    const config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runTask('meteor.setup');
    }
  },
  'post.default.deploy'(api) {
    const config = api.getConfig();
    if (config.app && config.app.type === 'meteor') {
      return api.runTask('meteor.deploy');
    }
  }
};
