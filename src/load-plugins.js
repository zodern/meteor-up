import fs from 'fs';
import resolveFrom from 'resolve-from';
import globalModules from 'global-modules';
import { resolve, join } from 'path';
import registerCommand from './commands';
import { registerHook } from './hooks';
import { addPluginValidator } from './validate';
import path from 'path';
import debug from 'debug';

const log = debug('mup:plugin-loader');

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

export function locatePluginDir(name, configPath, appPath) {
  log(`loading plugin ${name}`);

  if (name.indexOf('.') === 0 || name.indexOf('/') === 0 || name.indexOf('~') === 0) {
    log('plugin name is a path to the plugin');
    return name;
  }

  const configLocalPath = resolveFrom.silent(configPath, name);
  if (configLocalPath) {
    log('plugin installed locally to config folder');
    return configLocalPath;
  }
  try {
    const mupLocal = require.resolve(name);
    log('plugin installed locally with mup');
    return mupLocal;
  } catch (e) {
    // Continues to next location to resolve from
  }

  const appLocalPath = resolveFrom.silent(appPath, name);
  if (appLocalPath) {
    log('plugin installed locall in app folder');
    return appLocalPath;
  }

  log(`global install path: ${globalModules}`);
  const globalPath = resolveFrom.silent(path.resolve(globalModules, '..'), name);
  if (globalPath) {
    log('plugin installed globally');
    return globalPath;
  }
  log('plugin not found');
  return name;
}

export function loadPlugins(plugins) {
  plugins
    .map(plugin => {
      try {
        let module = require(plugin.path); // eslint-disable-line global-require
        let name = module.name || plugin.name;
        return { name, module };
      } catch (e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
          console.log(e);
        }
        console.log(`Unable to load plugin ${plugin.name}`);
        return { name: module.name || plugin.name, failed: true };
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

function isDirectoryMupModule({ name, path: modulePath }) {
  if (name === '__tests__') {
    return false;
  }

  const moduleDir = join(__dirname, modulePath);
  return fs.statSync(moduleDir).isDirectory();
}
