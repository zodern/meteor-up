import * as _commands from './commands';
import * as _tasks from './tasks';
import validator from './validate';

export const description = 'Setup and manage reverse proxy and ssl';

export const commands = _commands;
export const tasks = _tasks;

export const validate = {
  proxy: validator
};
