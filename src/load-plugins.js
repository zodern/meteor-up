import fs from 'fs';
import { resolve, join } from 'path';
import registerCommand from './api/commands';
import { registerHook } from './api/hooks';
import { addPluginValidator } from './api/validate';
const modules = {};
export default modules;

// Load all folders in ./plugins as MUP modules.
// The directory name is the module name.
let bundledPlugins = fs
  .readdirSync(resolve(__dirname, 'plugins'))
  .map(name => {
    return { name, path: `./plugins/${name}` };
  })
  .filter(isDirectoryMupModule);

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
        return {name: module.name || plugin.name, failed: true};
      }
    })
    .forEach(plugin => {
      if (plugin.failed) {
        return;
      }
      modules[plugin.name] = plugin.module;
      if (plugin.module.commands) {
        Object.keys(plugin.module.commands).forEach(key => {
          registerCommand(plugin.name, key, plugin.module.commands[key]);
        });
      }
      if (plugin.module.hooks) {
        Object.keys(plugin.module.hooks).forEach((key) => {
          registerHook(key, plugin.module.hooks[key]);
        });
      }
      if (typeof plugin.module.validate === 'object') {
        const validators = Object.entries(plugin.module.validate);
        for (const [property, validator] of validators) {
          addPluginValidator(property, validator);
        }
      }
    });
}

function isDirectoryMupModule({ name, path }) {
  if (name === '__tests__') {
    return false;
  }

  const moduleDir = join(__dirname, path);
  return fs.statSync(moduleDir).isDirectory();
}
