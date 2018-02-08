import {
  countOccurences,
  runSSHCommand
} from './utils';

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

export async function runRemoteHooks(serversConfig, command) {
  return Promise.all(Object.values(serversConfig)
    .map(server => runSSHCommand(server, command)
      .then(({
        output
      }) => {
        console.log(`=> output from ${server.host}`);
        console.log(output);
      })
      .catch(e => {
        console.error(`Error running remote hook command: ${command}`);
        console.error(e);
      })));
}
