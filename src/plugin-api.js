import * as utils from './utils';

import chalk from 'chalk';
import childProcess from 'child_process';
import { commands } from './commands';
import configValidator from './validate/index';
import fs from 'fs';
import { hooks } from './hooks';
import nodemiral from 'nodemiral';
import parseJson from 'parse-json';
import path from 'path';

const { resolvePath } = utils;

export default class PluginAPI {
  constructor(base, filteredArgs, program) {
    this.base = program['config'] ? path.dirname(this.configPath) : base;
    this.args = filteredArgs;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this.configPath = program['config'] ? resolvePath(this.configPath) : path.join(this.base, 'mup.js');
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
      // Looks for "package-name@" in the begining of a
      // line or at the start of the file
      let regex = new RegExp(`(^|\\s)${name}@`, 'm');
      return regex.test(contents);

    } catch (e) {
      console.log(`Unable to load file ${resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')}`);
      return false;
    }
  }

  validateConfig(configPath) {
    let problems = configValidator(this.config);

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
  _runHookScript(script) {
    childProcess.execSync(script, {
      cwd: this.getBasePath(),
      stdio: 'inherit'
    });
  }
  _runPreHooks = async function(name) {
    let hookName = `pre.${name}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      let hookList = hooks[hookName];
      for (let hookHandler of hookList) {
        if (hookHandler.localCommand) {
          this._runHookScript(hookHandler.localCommand);
        } else if (typeof hookHandler.method === 'function') {
          try {
            await hookHandler.method(this, nodemiral);
          } catch (e) {
            this._commandErrorHandler(e);
          }
        }
      }
    }
  };
  _runPostHooks = async function(commandName) {
    const hookName = `post.${commandName}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    let that = this;
    if (hookName in hooks) {
      let hookList = hooks[hookName];
      for (let hookHandler of hookList) {
        if (hookHandler.localCommand) {
          that._runHookScript(hookHandler.localCommand);
        } else if (typeof hookHandler.method === 'function') {
          try {
            await hookHandler.method(that, nodemiral);
          } catch (e) {
            this._commandErrorHandler(e);
          }
        }
      }
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
      console.error('Command name is required');
      return false;
    }

    if (!(name in commands)) {
      console.error(`Unknown command name: ${name}`);
      return false;
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

  withSessions(modules = []) {
    const api = Object.create(this);
    api.sessions = this._pickSessions(modules);
    return api;
  }

  _pickSessions(modules = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    const sessions = {};

    modules.forEach(moduleName => {
      const moduleConfig = this.config[moduleName];
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
