import * as _commands from './commands';
import validator from './validate';

export const description = 'Setup and manage reverse proxy and ssl';

export const commands = _commands;

export const validate = {
  proxy: validator
};
