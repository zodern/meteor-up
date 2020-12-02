import * as swarmUtils from './swarm-utils';
import * as tasks from './tasks';
import * as utils from './utils';
import configValidator, { showDepreciations, showErrors } from './validate/index';
import { hooks, runRemoteHooks } from './hooks';
import { parseDockerInfo, StatusDisplay } from './status';
import chalk from 'chalk';
import childProcess from 'child_process';
import { cloneDeep } from 'lodash';
import { commands } from './commands';
import debug from 'debug';
import fs from 'fs';
import { getOptions } from './swarm-options';
import nodemiral from '@zodern/nodemiral';
import parseJson from 'parse-json';
import path from 'path';
import { runConfigPreps } from './prepare-config';
import { scrubConfig } from './scrub-config';
import serverInfo from './server-info';

const { resolvePath, moduleNotFoundIsPath } = utils;
const log = debug('mup:api');

export default class PluginAPI {
  constructor(base, filteredArgs, program) {
    this.base = program.config ? path.dirname(program.config) : base;
    this.args = filteredArgs;
    this._origionalConfig = null;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this._enabledSessions = program.servers ? program.servers.split(' ') : [];
    this.configPath = program.config ? resolvePath(program.config) : path.join(this.base, 'mup.js');
    this.settingsPath = program.settings;
    this.verbose = program.verbose;
    this.program = program;
    this.commandHistory = [];
    this.profileTasks = process.env.MUP_PROFILE_TASKS === 'true';

    this.validationErrors = [];

    this.resolvePath = utils.resolvePath;
    this.getDockerLogs = utils.getDockerLogs;
    this.runSSHCommand = utils.runSSHCommand;
    this.forwardPort = utils.forwardPort;
    this._createSSHOptions = utils.createSSHOptions;

    this.statusHelpers = {
      StatusDisplay,
      parseDockerInfo
    };

    this.tasks = tasks;
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
      const contents = fs
        .readFileSync(resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions'))
        .toString();
      // Looks for "package-name@" in the beginning of a
      // line or at the start of the file
      const regex = new RegExp(`(^|\\s)${name}@`, 'm');

      return regex.test(contents);
    } catch (e) {
      console.log(`Unable to load file ${resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')}`);

      return false;
    }
  }

  runTaskList(list, sessions, opts = {}) {
    if (!('verbose' in opts)) {
      opts.verbose = this.verbose;
    }
    if (!('showDuration' in opts)) {
      opts.showDuration = this.profileTasks;
    }

    return utils.runTaskList(list, sessions, opts);
  }

  validateConfig(configPath, logProblems) {
    // Only print errors once.
    if (this.validationErrors.length > 0) {
      return this.validationErrors;
    }
    const config = this.getConfig();
    const {
      errors,
      depreciations
    } = configValidator(config, this._origionalConfig);
    const problems = [...errors, ...depreciations];

    if (problems.length > 0 && logProblems) {
      console.log(`loaded config from ${configPath}`);
      console.log('');

      if (errors.length) {
        showErrors(errors);
      }

      if (depreciations.length) {
        showDepreciations(depreciations);
      }

      console.log(
        'Read the docs and view example configs at'
      );
      console.log('    http://meteor-up.com/docs');
      console.log('');
    }

    this.validationErrors = problems;

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

    return runConfigPreps(config);
  }
  getConfig(validate = true) {
    if (!this.config) {
      try {
        delete require.cache[require.resolve(this.configPath)];
        // eslint-disable-next-line global-require
        this.config = require(this.configPath);
        this._origionalConfig = cloneDeep(this.config);
      } catch (e) {
        if (!validate) {
          return {};
        }
        if (e.code === 'MODULE_NOT_FOUND' && moduleNotFoundIsPath(e, this.configPath)) {
          console.error('"mup.js" file not found at');
          console.error(`  ${this.configPath}`);
          console.error('Run "mup init" to create it.');
        } else {
          console.error(chalk.red('Error loading config file:'));
          console.error(e);
        }
        process.exit(1);
      }
      this.config = this._normalizeConfig(this.config);

      this.validateConfig(this.configPath, validate);
    }

    return this.config;
  }

  scrubConfig() {
    const config = this.getConfig();

    return scrubConfig(config);
  }

  getSettings() {
    if (!this.settings) {
      let filePath;

      if (this.settingsPath) {
        filePath = resolvePath(this.settingsPath);
      } else {
        filePath = path.join(this.base, 'settings.json');
      }
      this.settings = this.getSettingsFromPath(filePath);
    }

    return this.settings;
  }

  getSettingsFromPath(settingsPath) {
    const filePath = resolvePath(settingsPath);
    let settings;

    try {
      settings = fs.readFileSync(filePath).toString();
    } catch (e) {
      console.log(`Unable to load settings.json at ${filePath}`);
      if (e.code !== 'ENOENT') {
        console.log(e);
      } else {
        [
          'It does not exist.',
          '',
          'You can create the file with "mup init" or add the option',
          '"--settings path/to/settings.json" to load it from a',
          'different location.'
        ].forEach(text => console.log(text));
      }
      process.exit(1);
    }
    try {
      settings = parseJson(settings);
    } catch (e) {
      console.log('Error parsing settings file:');
      console.log(e.message);

      process.exit(1);
    }

    return settings;
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
      console.log('Hook failed.');
      process.exit(1);
    }
  }
  _runHooks = async function(handlers, hookName) {
    const messagePrefix = `> Running hook ${hookName}`;

    for (const hookHandler of handlers) {
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
    const hookName = `pre.${name}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      const hookList = hooks[hookName];

      await this._runHooks(hookList, name);
    }
  };
  _runPostHooks = async function(commandName) {
    const hookName = `post.${commandName}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      const hookList = hooks[hookName];

      await this._runHooks(hookList, hookName);
    }
  };
  _commandErrorHandler(e) {
    log('_commandErrorHandler');
    process.exitCode = 1;

    // Only show error when not from nodemiral
    // since nodemiral would have already shown the error
    if (!(e.nodemiralHistory instanceof Array)) {
      log('_commandErrorHandler: nodemiral error');
      console.error(e.stack || e);
    }

    if (e.solution) {
      console.log(chalk.yellow(e.solution));
    }

    process.exit(1);
  }
  runCommand = async function(name) {
    const firstCommand = this.commandHistory.length === 0;

    if (!name) {
      throw new Error('Command name is required');
    }

    if (!(name in commands)) {
      throw new Error(`Unknown command name: ${name}`);
    }

    this.commandHistory.push({ name });

    await this._runPreHooks(name);

    try {
      log('Running command', name);
      await commands[name].handler(this, nodemiral);
    } catch (e) {
      this._commandErrorHandler(e);
    }

    await this._runPostHooks(name).then(() => {
      // The post hooks for the first command should be the last thing run
      if (firstCommand) {
        this._cleanupSessions();
      }
    });
  }

  async getServerInfo(selectedServers, collectors) {
    if (this._cachedServerInfo && !collectors) {
      return this._cachedServerInfo;
    }
    const serverConfig = this.getConfig().servers;

    const servers = (
      selectedServers || Object.keys(this.getConfig().servers)
    ).map(serverName => ({
      ...serverConfig[serverName],
      name: serverName
    }));

    if (!collectors) {
      console.log('');
      console.log('=> Collecting Docker information');
    }

    const result = await serverInfo(servers, collectors);

    if (!collectors) {
      this._cachedServerInfo = result;
    }

    return result;
  }

  serverInfoStale() {
    this._cachedServerInfo = null;
  }

  getSessions(modules = []) {
    const sessions = this._pickSessions(modules);

    return Object.keys(sessions).map(name => sessions[name]);
  }

  getSessionsForServers(servers = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    return servers.map(name => this.sessions[name]);
  }

  async getManagerSession() {
    const { currentManagers } = await this.swarmInfo();

    return this.getSessionsForServers(currentManagers)[0];
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

      for (const name in moduleConfig.servers) {
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
    for (const name in config.servers) {
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
        keepAlive: true,
        ssh: info.opts || {}
      };

      const sshAgent = process.env.SSH_AUTH_SOCK;

      opts.ssh.keepaliveInterval = opts.ssh.keepaliveInterval || 1000 * 28;
      opts.ssh.keepaliveCountMax = opts.ssh.keepaliveCountMax || 12;

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

  _cleanupSessions() {
    log('cleaning up sessions');
    if (!this.sessions) {
      return;
    }

    Object.keys(this.sessions).forEach(key => {
      this.sessions[key].close();
    });
  }

  swarmEnabled() {
    const config = this.getConfig();

    return config.swarm && config.swarm.enabled;
  }

  async swarmInfo() {
    const info = await this.getServerInfo();
    const currentManagers = swarmUtils.currentManagers(info);
    const desiredManagers = swarmUtils.desiredManagers(this.getConfig(), info);
    const nodes = swarmUtils.findNodes(info);
    const nodeIdsToServer = swarmUtils.nodeIdsToServer(info);
    const desiredLabels = getOptions(this.getConfig()).labels;
    const currentLabels = swarmUtils.currentLabels(info);
    const clusters = swarmUtils.findClusters(info);

    if (Object.keys(clusters).length > 1) {
      swarmUtils.showClusters(clusters, nodeIdsToServer);

      const error = new Error('multiple-clusters');

      error.solution = 'The servers in your config are in multiple swarm clusters. Any servers already in a swarm cluster should be in the same cluster. Look above for the list of clusters.';
      throw error;
    }

    return {
      currentManagers,
      desiredManagers,
      nodes,
      nodeIDs: nodeIdsToServer,
      desiredLabels,
      currentLabels
    };
  }

  async dockerServiceInfo(serviceName) {
    const manager = await this.getManagerSession();

    if (!manager) {
      const error = new Error('no-manager');

      error.solution = 'Enable swarm in your config and run "mup setup"';
      throw error;
    }

    const result = await this.runSSHCommand(manager, `sudo docker service inspect ${serviceName}`);
    let serviceInfo = null;

    try {
      [serviceInfo] = JSON.parse(result.output);
    } catch (e) {
      // empty
    }

    return serviceInfo;
  }
}
