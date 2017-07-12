import { countOccurences } from './utils';

export const hooks = {};

export function registerHook(_hookName, _handler) {
  let hookName = _hookName;
  let handler = _handler;

  if (countOccurences('\\.', hookName) === 1) {
    const sections = hookName.split('.');
    hookName = `${sections[0]}.default.${sections[1]}`;
  }

  if (typeof handler === 'function') {
    handler = {
      method: _handler
    };
  }

  if (hookName in hooks) {
    hooks[hookName].push(handler);
  } else {
    hooks[hookName] = [handler];
  }
}
