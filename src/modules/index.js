import fs from 'fs';
import path from 'path';
import commandWrapper from './command-wrapper';
import registerTask from '../tasks';
const modules = {};
export default modules;

// Load all subdirectories as MUP modules.
// The directory name is the module name.
let bundledPlugins = fs
  .readdirSync(__dirname)
  .filter(isDirectoryMupModule)
  .map(name => {
    return { name, path: `./${name}` };
  });

loadPlugins(bundledPlugins);

export function loadPlugins(plugins) {
  plugins
    .map(plugin => {
      try {
        let module = require(plugin.path); // eslint-disable-line global-require
        let name = module.name || plugin.name;
        return { name, module };
      } catch (e) {
        console.log(e);
        console.log(`Unable to load plugin ${plugin.name}`);
      }
    })
    .forEach(plugin => {
      modules[plugin.name] = plugin.module;
      if (plugin.module.tasks) {
        Object.keys(plugin.module.tasks).forEach(key => {
          registerTask(plugin.name, key, plugin.module.tasks[key]);
        });
      }
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
