import { countOccurences } from './utils';

export const hooks = {};

export function registerHook(_hookName, handler) {
  let hookName = _hookName;

  if (countOccurences('\\.', hookName) === 1) {
    const sections = hookName.split('.');
    hookName = `${sections[0]}.default.${sections[1]}`;
  }

  if (hookName in hooks) {
    hooks[hookName].push(handler);
  } else {
    hooks[hookName] = [handler];
  }
}
