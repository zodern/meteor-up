import fs from 'fs';
import path from 'path';

const modules = {};
export default modules;

// Load all subdirectories as MUP modules.
// The directory name is the module name.
fs.readdirSync(__dirname).filter(isMupModule).forEach(loadModule);

function isMupModule(name) {
  if (name === '__tests__') {
    return false;
  }

  const moduleDir = path.join(__dirname, name);
  return fs.statSync(moduleDir).isDirectory();
}

function loadModule(name) {
  const moduleDir = path.join(__dirname, name);
  modules[name] = require(moduleDir); // eslint-disable-line global-require
}

function addCommands(_yargs, module, moduleName) {
  let yargs = _yargs;
  Object.keys(module.commands).forEach((commandName) => {
    let command = module.commands[commandName];
    command.builder = command.builder || {};
    yargs = yargs.command(
        commandName,
        command.description,
        command.builder,
        command.handler
    );
  });
  if (moduleName !== 'default') {
    yargs.command(
    '*',
    false,
    {},
    () => {
      console.log(`Run "mup ${moduleName} help" for list of commands`);
    }
  );
  }
  return yargs;
}

export function addModuleCommands(yargs) {
  Object.keys(modules).forEach(moduleName => {
    if (moduleName !== 'default' && modules[moduleName].commands) {
      yargs.command(
        moduleName,
        modules[moduleName].description,
        (subYargs) => {
          return addCommands(subYargs, modules[moduleName], moduleName);
        }
      );
    } else if (moduleName === 'default') {
      addCommands(yargs, modules[moduleName], moduleName);
    }
  });
}
