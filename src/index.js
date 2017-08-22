import './node-version';
import './nodemiral';
import checkUpdates from './updates';
import modules, { loadPlugins, locatePluginDir } from './load-plugins';
import { registerHook } from './hooks';
import pkg from '../package.json';
import yargs from 'yargs';
import chalk from 'chalk';
import MupAPI from './plugin-api';
import { filterArgv } from './utils';

const unwantedArgvs = ['_', '$0', 'settings', 'config', 'verbose', 'show-hook-names', 'help', 'servers'];

function addModuleCommands(builder, module, moduleName) {
  Object.keys(module.commands).forEach(commandName => {
    let command = module.commands[commandName];
    command.builder = command.builder || {};

    builder.command(
      command.name || commandName,
      command.description,
      command.builder,
      commandWrapper(moduleName, commandName)
    );
  });
}

function commandWrapper(pluginName, commandName) {
  return function() {
    checkUpdates()
      .then(() => {
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
      })
      .catch(e => {
        console.error(e);
      });
  };
}

// Load config before creating commands
const preAPI = new MupAPI(process.cwd(), process.argv, yargs.argv);
const config = preAPI.getConfig(false);

// Load plugins
if (config.plugins instanceof Array) {
  loadPlugins(
    config.plugins.map(plugin => {
      return {
        name: plugin,
        path: locatePluginDir(plugin, preAPI.configPath, preAPI.app ? preAPI.app.path : '')
      };
    })
  );
}

// Load hooks
if (config.hooks) {
  Object.keys(config.hooks).forEach(key => {
    registerHook(key, config.hooks[key]);
  });
}

let program = yargs
  .usage(`\nUsage: ${chalk.yellow('mup')} <command> [args]`)
  .version(pkg.version)
  .alias('version', 'V')
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
  .alias('help', 'h')
  .epilogue(
  'For more information, read the docs at https://github.com/zodern/meteor-up'
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
