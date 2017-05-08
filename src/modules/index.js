import fs from 'fs';
import path from 'path';
import commandWrapper from './command-wrapper';
const modules = {};
export default modules;

// Load all subdirectories as MUP modules.
// The directory name is the module name.
fs.readdirSync(__dirname).filter(isDirectoryMupModule).forEach(loadModule);

export function loadPlugins(plugins) {
  console.dir(plugins);
  plugins.map((plugin) => {
    try {
      return { name: plugin, module: require(plugin) };
    } catch (e) {
      console.log(e);
      console.log(`Unable to load plugin ${plugin}`);
    }
  }).forEach((plugin) => {
    modules[plugin.module.name || plugin.name] = plugin.module;
  });
}

function isDirectoryMupModule(name) {
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
