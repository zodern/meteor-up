'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.locatePluginDir = locatePluginDir;
exports.loadPlugins = loadPlugins;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _validate = require('./validate');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _globalModules = require('global-modules');

var _globalModules2 = _interopRequireDefault(_globalModules);

var _commands = require('./commands');

var _commands2 = _interopRequireDefault(_commands);

var _hooks = require('./hooks');

var _prepareConfig = require('./prepare-config');

var _scrubConfig = require('./scrub-config');

var _resolveFrom = require('resolve-from');

var _resolveFrom2 = _interopRequireDefault(_resolveFrom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('mup:plugin-loader');

var modules = {};
exports.default = modules;

// Load all folders in ./plugins as mup plugins.
// The directory name is the module name.

var bundledPlugins = _fs2.default.readdirSync((0, _path.resolve)(__dirname, 'plugins')).map(function (name) {
  return { name: name, path: './plugins/' + name };
}).filter(isDirectoryMupModule);

loadPlugins(bundledPlugins);

function locatePluginDir(name, configPath, appPath) {
  log('loading plugin ' + name);

  if (name.indexOf('.') === 0 || name.indexOf('/') === 0 || name.indexOf('~') === 0) {
    log('plugin name is a path to the plugin');
    return name;
  }

  var configLocalPath = _resolveFrom2.default.silent(configPath, name);
  if (configLocalPath) {
    log('plugin installed locally to config folder');
    return configLocalPath;
  }
  try {
    var mupLocal = require.resolve(name);
    log('plugin installed locally with mup');
    return mupLocal;
  } catch (e) {
    // Continues to next location to resolve from
  }

  var appLocalPath = _resolveFrom2.default.silent(appPath, name);
  if (appLocalPath) {
    log('plugin installed locall in app folder');
    return appLocalPath;
  }

  log('global install path: ' + _globalModules2.default);
  var globalPath = _resolveFrom2.default.silent(_path2.default.resolve(_globalModules2.default, '..'), name);
  if (globalPath) {
    log('plugin installed globally');
    return globalPath;
  }
  log('plugin not found');
  return name;
}

function loadPlugins(plugins) {
  plugins.map(function (plugin) {
    try {
      var _module = require(plugin.path); // eslint-disable-line global-require
      var name = _module.name || plugin.name;
      return { name: name, module: _module };
    } catch (e) {
      var pathPosition = e.message.length - plugin.path.length - 1;

      // Hides error when plugin cannot be loaded
      // Show the error when a plugin cannot resolve a module
      if (e.code !== 'MODULE_NOT_FOUND' || e.message.indexOf(plugin.path) !== pathPosition) {
        console.log(e);
      }

      console.log('Unable to load plugin ' + plugin.name);
      return { name: module.name || plugin.name, failed: true };
    }
  }).filter(function (plugin) {
    return !plugin.failed;
  }).forEach(function (plugin) {
    modules[plugin.name] = plugin.module;
    if (plugin.module.commands) {
      Object.keys(plugin.module.commands).forEach(function (key) {
        (0, _commands2.default)(plugin.name, key, plugin.module.commands[key]);
      });
    }
    if (plugin.module.hooks) {
      Object.keys(plugin.module.hooks).forEach(function (key) {
        (0, _hooks.registerHook)(key, plugin.module.hooks[key]);
      });
    }
    if (_typeof(plugin.module.validate) === 'object') {
      var validators = Object.entries(plugin.module.validate);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = validators[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              property = _step$value[0],
              validator = _step$value[1];

          (0, _validate.addPluginValidator)(property, validator);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
    if (plugin.module.prepareConfig) {
      (0, _prepareConfig.registerPreparer)(plugin.module.prepareConfig);
    }
    if (plugin.module.scrubConfig) {
      (0, _scrubConfig.registerScrubber)(plugin.module.scrubConfig);
    }
  });
}

function isDirectoryMupModule(_ref) {
  var name = _ref.name,
      modulePath = _ref.path;

  if (name === '__tests__') {
    return false;
  }

  var moduleDir = (0, _path.join)(__dirname, modulePath);
  return _fs2.default.statSync(moduleDir).isDirectory();
}
//# sourceMappingURL=load-plugins.js.map