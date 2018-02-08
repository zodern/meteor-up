import * as _commands from './commands';
import traverse from 'traverse';

export const commands = _commands;

export function scrubConfig(config) {
  if (config.servers) {
    // eslint-disable-next-line
    config.servers = traverse(config.servers).map(function() {
      if (this.path.length !== 2) {
        // eslint-disable-next-line
        return;
      }

      switch (this.key) {
        case 'host':
          return this.update('1.2.3.4');
        case 'password':
          return this.update('password');
        case 'pem':
          return this.update('~/.ssh/pem');

        // no default
      }
    });
  }

  return config;
}
