import * as utils from './utils';

import chalk from 'chalk';
import childProcess from 'child_process';
import { commands } from './commands';
import configValidator from './validate/index';
import fs from 'fs';
import { hooks, runRemoteHooks } from './hooks';
import nodemiral from 'nodemiral';
import parseJson from 'parse-json';
import path from 'path';

const { resolvePath } = utils;

export default class PluginAPI {
  constructor(base, filteredArgs, program) {
    this.base = program['config'] ? path.dirname(program['config']) : base;
    this.args = filteredArgs;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this._enabledSessions = program.servers.split(',') || [];
    this.configPath = program['config'] ? resolvePath(program['config']) : path.join(this.base, 'mup.js');
    this.settingsPath = program['settings'];
    this.verbose = program.verbose;
    this.program = program;

    this.resolvePath = utils.resolvePath;
    this.runTaskList = utils.runTaskList;
    this.getDockerLogs = utils.getDockerLogs;
    this.runSSHCommand = utils.runSSHCommand;
  }

  getArgs() {
    return this.args;
  }

  getBasePath() {
    return this.base;
  }

  getVerbose() {
    return this.verbose;
  }

  getOptions() {
    return this.program;
  }

  hasMeteorPackage(name) {
    // Check if app is using the package
    try {
      var contents = fs
        .readFileSync(resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions'))
        .toString();
      // Looks for "package-name@" in the beginning of a
      // line or at the start of the file
      let regex = new RegExp(`(^|\\s)${name}@`, 'm');
      return regex.test(contents);

    } catch (e) {
      console.log(`Unable to load file ${resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')}`);
      return false;
    }
  }

  validateConfig(configPath) {
    let problems = configValidator(this.getConfig());

    if (problems.length > 0) {
      let red = chalk.red;
      let plural = problems.length > 1 ? 's' : '';

      console.log(`loaded config from ${configPath}`);
      console.log('');
      console.log(red(`${problems.length} Validation Error${plural}`));

      problems.forEach(problem => {
        console.log(red(`  - ${problem}`));
      });

      console.log('');
      console.log(
        'Read the docs and view example configs at'
      );
      console.log('    https://zodern.github.io/meteor-up/docs');
      console.log('');
    }

    return problems;
  }
  _normalizeConfig(config) {
    if (typeof config !== 'object') {
      return config;
    }
    if (config.meteor && typeof config.app !== 'object') {
      config.app = Object.assign({}, config.meteor);
      config.app.type = 'meteor';
    } else if (typeof config.app === 'object' && !('type' in config.app)) {
      config.app.type = 'meteor';
    }
    return config;
  }
  getConfig(validate = true) {
    if (!this.config) {
      try {
        // eslint-disable-next-line global-require
        this.config = require(this.configPath);
      } catch (e) {
        if (!validate) {
          return {};
        }
        if (e.code === 'MODULE_NOT_FOUND') {
          console.error('"mup.js" file not found at');
          console.error(`  ${this.configPath}`);
          console.error('Run "mup init" to create it.');
        } else {
          console.error(e);
        }
        process.exit(1);
      }
      if (validate) {
        this.validateConfig(this.configPath);
      }
      this.config = this._normalizeConfig(this.config);
    }

    return this.config;
  }

  getSettings() {
    if (!this.settings) {
      let filePath;
      if (this.settingsPath) {
        filePath = resolvePath(this.settingsPath);
      } else {
        filePath = path.join(this.base, 'settings.json');
      }

      try {
        this.settings = fs.readFileSync(filePath).toString();
      } catch (e) {
        console.log(`Unable to load settings.json at ${filePath}`);
        if (e.code !== 'ENOENT') {
          console.log(e);
        }
        process.exit(1);
      }
      try {
        this.settings = parseJson(this.settings);
      } catch (e) {
        console.log('Error parsing settings file:');
        console.log(e.message);
        process.exit(1);
      }
    }

    return this.settings;
  }

  setConfig(newConfig) {
    this.config = newConfig;
  }

  _runHookScript(script) {
    try {
      childProcess.execSync(script, {
        cwd: this.getBasePath(),
        stdio: 'inherit'
      });
    } catch (e) {
      // do nothing
    }
  }
  _runHooks = async function(handlers, hookName) {
    const messagePrefix = `> Running hook ${hookName}`;
    for (let hookHandler of handlers) {
      if (hookHandler.localCommand) {
        console.log(`${messagePrefix} "${hookHandler.localCommand}"`);
        this._runHookScript(hookHandler.localCommand);
      }
      if (typeof hookHandler.method === 'function') {
        try {
          await hookHandler.method(this, nodemiral);
        } catch (e) {
          this._commandErrorHandler(e);
        }
      }
      if (hookHandler.remoteCommand) {
        console.log(
          `${messagePrefix} remote command "${hookHandler.remoteCommand}"`
        );
        await runRemoteHooks(
          this.getConfig().servers,
          hookHandler.remoteCommand
        );
      }
    }
  }
  _runPreHooks = async function(name) {
    let hookName = `pre.${name}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      let hookList = hooks[hookName];
      await this._runHooks(hookList, name);
    }
  };
  _runPostHooks = async function(commandName) {
    const hookName = `post.${commandName}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      let hookList = hooks[hookName];
      await this._runHooks(hookList, hookName);
    }
    return;
  };
  _commandErrorHandler(e) {
    if (e.nodemiralHistory instanceof Array) {
      // Error is from nodemiral when running a task list.
      // Nodemiral should have already displayed the error
      return;
    }

    console.error(e);
    process.exitCode = 1;
  }
  runCommand = async function(name) {
    if (!name) {
      throw new Error('Command name is required');
    }

    if (!(name in commands)) {
      throw new Error(`Unknown command name: ${name}`);
    }
    await this._runPreHooks(name);
    let potentialPromise;
    try {
      potentialPromise = commands[name].handler(this);
    } catch (e) {
      this._commandErrorHandler(e);
      process.exit(1);
    }

    if (potentialPromise && typeof potentialPromise.then === 'function') {
      return potentialPromise.then(() => this._runPostHooks(name));
    }
    return await this._runPostHooks(name);
  };

  getSessions(modules = []) {
    const sessions = this._pickSessions(modules);
    return Object.keys(sessions).map(name => sessions[name]);
  }

  _pickSessions(plugins = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    const sessions = {};

    plugins.forEach(moduleName => {
      const moduleConfig = this.getConfig()[moduleName];
      if (!moduleConfig) {
        return;
      }

      for (var name in moduleConfig.servers) {
        if (!moduleConfig.servers.hasOwnProperty(name)) {
          continue;
        }

        if (this.sessions[name]) {
          sessions[name] = this.sessions[name];
        }
      }
    });

    return sessions;
  }

  _loadSessions() {
    const config = this.getConfig();
    this.sessions = {};

    // `mup.servers` contains login information for servers
    // Use this information to create nodemiral sessions.
    for (var name in config.servers) {
      if (!config.servers.hasOwnProperty(name)) {
        continue;
      }

      if (
          this._enabledSessions.length > 0 &&
          this._enabledSessions.indexOf(name) === -1
        ) {
        continue;
      }

      const info = config.servers[name];
      const auth = {
        username: info.username
      };
      const opts = {
        ssh: {}
      };

      var sshAgent = process.env.SSH_AUTH_SOCK;

      if (info.opts) {
        opts.ssh = info.opts;
      }

      if (info.pem) {
        try {
          auth.pem = fs.readFileSync(resolvePath(info.pem), 'utf8');
        } catch (e) {
          console.error(`Unable to load pem at "${resolvePath(info.pem)}"`);
          console.error(`for server "${name}"`);
          if (e.code !== 'ENOENT') {
            console.log(e);
          }
          process.exit(1);
        }
      } else if (info.password) {
        auth.password = info.password;
      } else if (sshAgent && fs.existsSync(sshAgent)) {
        opts.ssh.agent = sshAgent;
      } else {
        console.error(
          "error: server %s doesn't have password, ssh-agent or pem",
          name
        );
        process.exit(1);
      }

      const session = nodemiral.session(info.host, auth, opts);
      this.sessions[name] = session;
    }
  }
}
