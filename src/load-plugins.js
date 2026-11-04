import { dirname, join, resolve } from 'path';
import { moduleNotFoundIsPath, resolvePath } from './utils.js';
import { addPluginValidator } from './validate/index.js';
import chalk from 'chalk';
import { createRequire } from 'node:module';
import debug from 'debug';
import { fileURLToPath } from 'url';
import fs from 'fs';
import globalModules from 'global-modules';
import registerCommand from './commands.js';
import { registerHook } from './hooks.js';
import { registerPreparer } from './prepare-config.js';
import { registerScrubber } from './scrub-config.js';
import { registerSwarmOptions } from './swarm-options.js';
import resolveFrom from 'resolve-from';

const log = debug('mup:plugin-loader');

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const modules = {};
export default modules;

// Load all folders in ./plugins as mup plugins.
// The directory name is the module name.
const bundledPlugins = fs
  .readdirSync(resolve(__dirname, 'plugins'))
  .map(name => ({ name, path: `./plugins/${name}/index.js` }))
  .filter(isDirectoryMupPlugin);

await loadPlugins(bundledPlugins);

export function locatePluginDir(name, configPath, appPath) {
  log(`loading plugin ${name}`);

  if (name.indexOf('.') === 0 || name.indexOf('/') === 0 || name.indexOf('~') === 0) {
    log('plugin name is a path to the plugin');

    return resolvePath(configPath, '../', name);
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
  const globalPath = resolveFrom.silent(resolve(globalModules, '..'), name);
  if (globalPath) {
    log('plugin installed globally');

    return globalPath;
  }
  log('plugin not found');

  return name;
}

function registerPlugin(plugin) {
  if (plugin.module.commands) {
    Object.keys(plugin.module.commands).forEach(key => {
      registerCommand(plugin.name, key, plugin.module.commands[key]);
    });
  }
  if (plugin.module.hooks) {
    Object.keys(plugin.module.hooks).forEach(key => {
      registerHook(key, plugin.module.hooks[key]);
    });
  }
  if (typeof plugin.module.validate === 'object') {
    const validators = Object.entries(plugin.module.validate);
    for (const [property, validator] of validators) {
      addPluginValidator(property, validator);
    }
  }
  if (plugin.module.prepareConfig) {
    registerPreparer(plugin.module.prepareConfig);
  }
  if (plugin.module.scrubConfig) {
    registerScrubber(plugin.module.scrubConfig);
  }
  if (plugin.module.swarmOptions) {
    registerSwarmOptions(plugin.module.swarmOptions);
  }
}

export async function loadPlugins(plugins) {
  for (const plugin of plugins) {
    try {
      // TODO: try require first, and fallback to import
      const module = await import(plugin.path);
      const name = module.name || plugin.name;
      modules[name] = module;
      registerPlugin({ name, module });
    } catch (e) {
      console.log(chalk.red(`Unable to load plugin ${plugin.name}`));

      // Hides error when plugin cannot be loaded
      // Show the error when a plugin cannot resolve a module
      if (
        e.code !== 'MODULE_NOT_FOUND' ||
        !moduleNotFoundIsPath(e, plugin.path)
      ) {
        console.log(e);
      }
    }
  }
}

function isDirectoryMupPlugin({ name, path: modulePath }) {
  if (name === '__tests__') {
    return false;
  }

  const moduleDir = join(__dirname, dirname(modulePath));

  return fs.statSync(moduleDir).isDirectory();
}
