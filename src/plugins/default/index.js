import * as _commands from './commands';
import traverse from 'traverse';

export let commands = _commands;

export function scrubConfig(config) {
  if (config.servers) {
    config.servers = traverse(config.servers).map(function() {
      if (this.path.length !== 2) {
        return;
      }

      switch (this.key) {
        case 'host':
          return this.update('1.2.3.4');
        case 'password':
          return this.update('password');
        case 'pem':
          return this.update('~/.ssh/pem');
      }
    });
  }

  return config;
}
