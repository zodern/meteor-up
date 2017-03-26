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

export function addModuleCommands(parser) {
  Object.keys(modules).forEach(moduleName => {
    let description;
    let commands;
    try {
      description = require(`./${moduleName}/commands.js`).description;
      commands = require(`./${moduleName}/commands.js`).commands;
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        console.log(e);
      }
      return;
    }
    if (moduleName !== 'default') {
      parser.command(moduleName, description, commands);
    } else {
      commands(parser);
    }
  });
}

function loadModule(name) {
  const moduleDir = path.join(__dirname, name);
  modules[name] = require(moduleDir); // eslint-disable-line global-require
}
