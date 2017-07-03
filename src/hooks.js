export const hooks = {};

export function registerHook(hookName, handler) {
  if (hookName in hooks) {
    hooks[hookName].push(handler);
  } else {
    hooks[hookName] = [handler];
  }
}
