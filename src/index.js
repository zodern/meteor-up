import './node-version';
import './nodemiral';
import modules, { loadPlugins, locatePluginDir } from './load-plugins';
import chalk from 'chalk';
import checkUpdates from './updates';
import { filterArgv } from './utils';
import MupAPI from './plugin-api';
import pkg from '../package.json';
import { registerHook } from './hooks';
import yargs from 'yargs';

const unwantedArgvs = ['_', '$0', 'settings', 'config', 'verbose', 'show-hook-names', 'help', 'servers'];

// Prevent yargs from exiting the process before plugins are loaded
yargs.help(false);

// Load config before creating commands
const preAPI = new MupAPI(process.cwd(), process.argv, yargs.argv);
const config = preAPI.getConfig(false);
let pluginList = [];

// Load plugins
if (config.plugins instanceof Array) {
  const appPath = config.app && config.app.path ? config.app.path : '';
  const absoluteAppPath = preAPI.resolvePath(preAPI.base, appPath);

  pluginList = config.plugins.map(plugin => ({
    name: plugin,
    path: locatePluginDir(plugin, preAPI.configPath, absoluteAppPath)
  }));

  loadPlugins(pluginList);
}

// Load hooks
if (config.hooks) {
  Object.keys(config.hooks).forEach(key => {
    registerHook(key, config.hooks[key]);
  });
}

function commandWrapper(pluginName, commandName) {
  return function() {
    // Runs in parallel with command
    checkUpdates([
      { name: pkg.name, path: require.resolve('../package.json') },
      ...pluginList
    ]);

    const rawArgv = process.argv.slice(2);
    const filteredArgv = filterArgv(rawArgv, yargs.argv, unwantedArgvs);
    const api = new MupAPI(process.cwd(), filteredArgv, yargs.argv);
    let potentialPromise;

    try {
      potentialPromise = api.runCommand(`${pluginName}.${commandName}`);
    } catch (e) {
      api._commandErrorHandler(e);
    }

    if (potentialPromise && typeof potentialPromise.then === 'function') {
      potentialPromise.catch(api._commandErrorHandler);
    }
  };
}

function addModuleCommands(builder, module, moduleName) {
  Object.keys(module.commands).forEach(commandName => {
    const command = module.commands[commandName];
    const name = command.name || commandName;

    command.builder = command.builder || {};
    builder.command(
      name,
      command.description.length === 0 ? false : command.description,
      command.builder,
      commandWrapper(moduleName, commandName)
    );
  });
}

let program = yargs
  .usage(`\nUsage: ${chalk.yellow('mup')} <command> [args]`)
  .version(pkg.version)
  .alias('v', 'version')
  .global('version', false)
  .option('settings', {
    description: 'Path to Meteor settings file',
    requiresArg: true,
    string: true
  })
  .option('config', {
    description: 'Path to mup.js config file',
    requiresArg: true,
    string: true
  })
  .option('servers', {
    description: 'Comma separated list of servers to use',
    requiresArg: true,
    string: true
  })
  .option('verbose', {
    description: 'Print output from build and server scripts',
    boolean: true
  })
  .option('show-hook-names', {
    description: 'Prints names of the available hooks as the command runs',
    boolean: true
  })
  .strict(true)
  .scriptName('mup')
  .alias('h', 'help')
  .epilogue(
    'For more information, read the docs at http://meteor-up.com/docs.html'
  )
  .help('help');

Object.keys(modules).forEach(moduleName => {
  if (moduleName !== 'default' && modules[moduleName].commands) {
    yargs.command(
      moduleName,
      modules[moduleName].description,
      subYargs => {
        addModuleCommands(subYargs, modules[moduleName], moduleName);
      },
      () => {
        yargs.showHelp('log');
      }
    );
  } else if (moduleName === 'default') {
    addModuleCommands(yargs, modules[moduleName], moduleName);
  }
});

program = program.argv;

if (program._.length === 0) {
  yargs.showHelp();
}
