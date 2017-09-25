'use strict';

require('./node-version');

require('./nodemiral');

var _updates = require('./updates');

var _updates2 = _interopRequireDefault(_updates);

var _loadPlugins = require('./load-plugins');

var _loadPlugins2 = _interopRequireDefault(_loadPlugins);

var _hooks = require('./hooks');

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _pluginApi = require('./plugin-api');

var _pluginApi2 = _interopRequireDefault(_pluginApi);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var unwantedArgvs = ['_', '$0', 'settings', 'config', 'verbose', 'show-hook-names', 'help', 'servers'];

function addModuleCommands(builder, module, moduleName) {
  Object.keys(module.commands).forEach(function (commandName) {
    var command = module.commands[commandName];
    command.builder = command.builder || {};

    builder.command(command.name || commandName, command.description, command.builder, commandWrapper(moduleName, commandName));
  });
}

function commandWrapper(pluginName, commandName) {
  return function () {
    (0, _updates2.default)().then(function () {
      var rawArgv = process.argv.slice(2);
      var filteredArgv = (0, _utils.filterArgv)(rawArgv, _yargs2.default.argv, unwantedArgvs);
      var api = new _pluginApi2.default(process.cwd(), filteredArgv, _yargs2.default.argv);
      var potentialPromise = void 0;

      try {
        potentialPromise = api.runCommand(pluginName + '.' + commandName);
      } catch (e) {
        api._commandErrorHandler(e);
      }

      if (potentialPromise && typeof potentialPromise.then === 'function') {
        potentialPromise.catch(api._commandErrorHandler);
      }
    }).catch(function (e) {
      console.error(e);
    });
  };
}

// Load config before creating commands
var preAPI = new _pluginApi2.default(process.cwd(), process.argv, _yargs2.default.argv);
var config = preAPI.getConfig(false);

// Load plugins
if (config.plugins instanceof Array) {
  (0, _loadPlugins.loadPlugins)(config.plugins.map(function (plugin) {
    return {
      name: plugin,
      path: (0, _loadPlugins.locatePluginDir)(plugin, preAPI.configPath, preAPI.app ? preAPI.app.path : '')
    };
  }));
}

// Load hooks
if (config.hooks) {
  Object.keys(config.hooks).forEach(function (key) {
    (0, _hooks.registerHook)(key, config.hooks[key]);
  });
}

var program = _yargs2.default.usage('\nUsage: ' + _chalk2.default.yellow('mup') + ' <command> [args]').version(_package2.default.version).alias('version', 'V').global('version', false).option('settings', {
  description: 'Path to Meteor settings file',
  requiresArg: true,
  string: true
}).option('config', {
  description: 'Path to mup.js config file',
  requiresArg: true,
  string: true
}).option('servers', {
  description: 'Comma separated list of servers to use',
  requiresArg: true,
  string: true
}).option('verbose', {
  description: 'Print output from build and server scripts',
  boolean: true
}).option('show-hook-names', {
  description: 'Prints names of the available hooks as the command runs',
  boolean: true
}).strict(true).alias('help', 'h').epilogue('For more information, read the docs at http://meteor-up.com/docs.html').help('help');

Object.keys(_loadPlugins2.default).forEach(function (moduleName) {
  if (moduleName !== 'default' && _loadPlugins2.default[moduleName].commands) {
    _yargs2.default.command(moduleName, _loadPlugins2.default[moduleName].description, function (subYargs) {
      addModuleCommands(subYargs, _loadPlugins2.default[moduleName], moduleName);
    }, function () {
      _yargs2.default.showHelp('log');
    });
  } else if (moduleName === 'default') {
    addModuleCommands(_yargs2.default, _loadPlugins2.default[moduleName], moduleName);
  }
});

program = program.argv;

if (program._.length === 0) {
  _yargs2.default.showHelp();
}
//# sourceMappingURL=index.js.map