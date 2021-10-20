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
import { serverSources } from './server-sources';
import { checkSetup, updateSetupKeys } from './check-setup';

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
    this._serverGroupServers = Object.create(null);
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

    opts._mupPluginApi = this;

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

      this.validationErrors = problems;
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

    return runConfigPreps(config, this);
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
  _runHooks = async function(handlers, hookName, secondArg) {
    const messagePrefix = `> Running hook ${hookName}`;

    for (const hookHandler of handlers) {
      if (hookHandler.localCommand) {
        console.log(`${messagePrefix} "${hookHandler.localCommand}"`);
        this._runHookScript(hookHandler.localCommand);
      }
      if (typeof hookHandler.method === 'function') {
        try {
          await hookHandler.method(this, secondArg || nodemiral);
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
  async _runDuringHooks(name, session) {
    const hookName = `during.${name}`;

    if (this.program['show-hook-names']) {
      console.log(chalk.yellow(`Hook: ${hookName}`));
    }

    if (hookName in hooks) {
      const hookList = hooks[hookName];

      await this._runHooks(hookList, name, { session });
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

    await this._runPostHooks(name);

    if (name === 'default.setup') {
      console.log('=> Storing setup config on servers');
      await updateSetupKeys(this);
    }

    // The post hooks for the first command should be the last thing run
    if (firstCommand) {
      this._cleanupSessions();
    }
  }

  expandServers(serversObj) {
    let result = {};
    const serverConfig = this.getConfig().servers;

    Object.entries(serversObj).forEach(([key, config]) => {
      if (key in this._serverGroupServers) {
        this._serverGroupServers[key].forEach(server => {
          result[server.name] = { server, config };
        });
      } else {
        result[key] = {
          server: serverConfig[key],
          config
        };
      }
    });

    return result;
  }

  async getServerInfo(selectedServers, collectors) {
    if (this._cachedServerInfo && !collectors) {
      return this._cachedServerInfo;
    }
    const serverConfig = this.expandServers(this.getConfig().servers);

    const servers = (
      selectedServers || Object.keys(serverConfig)
    ).map(serverName => ({
      ...serverConfig[serverName].server,
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

  async checkSetupNeeded() {
    const [upToDate, serverGroupsUpToDate] = await Promise.all([
      checkSetup(this),
      this._serverGroupsUpToDate()
    ]);

    return !upToDate || !serverGroupsUpToDate;
  }

  _mapServerGroup(cb) {
    const { servers } = this.getConfig(false);

    if (typeof servers !== 'object' || servers === null) {
      return [];
    }

    return Object.entries(servers)
      .filter(([, serverConfig]) => serverConfig && typeof serverConfig.source === 'string')
      .map(async ([name, serverConfig]) => {
        const source = serverConfig.source;

        if (!(source in serverSources)) {
          throw new Error(`Unrecognized server source: ${source}. Available: ${Object.keys(serverSources)}`);
        }

        return cb(name, serverConfig);
      });
  }

  async loadServerGroups() {
    const promises = this._mapServerGroup(async (name, groupConfig) => {
      const source = groupConfig.source;
      const list = await serverSources[source].load(
        { name, groupConfig }, this
      );
      this._serverGroupServers[name] = list;

      // TODO: handle errors. We should delay throwing the error until
      // we need the sessions from this server group
    });

    await Promise.all(promises);
  }

  async _serverGroupsUpToDate() {
    const promises = this._mapServerGroup((name, groupConfig) => {
      const source = groupConfig.source;

      return serverSources[source].upToDate({ name, groupConfig }, this);
    });

    const result = await Promise.all(promises);

    return result.every(upToDate => upToDate);
  }

  async updateServerGroups() {
    this.sessions = null;

    const promises = this._mapServerGroup(async (name, groupConfig) => {
      const source = groupConfig.source;
      await serverSources[source].update({ name, groupConfig }, this);
      const list = await serverSources[source].load(
        { name, groupConfig }, this
      );
      this._serverGroupServers[name] = list;
    });

    await Promise.all(promises).catch(e => {
      console.dir(e);
      throw e;
    });
  }

  getSessions(modules = []) {
    const sessions = this._pickSessions(modules);

    return Object.keys(sessions).map(name => sessions[name]);
  }

  getSessionsForServers(servers = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    let result = [];

    servers.forEach(name => {
      let session = this.sessions[name];
      if (Array.isArray(session)) {
        session.forEach(memberName => {
          result.push(this.sessions[memberName]);
        });
      } else {
        result.push(session);
      }
    });

    return result;
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

        if (!this.sessions[name]) {
          continue;
        }

        if (Array.isArray(this.sessions[name])) {
          // Is a server group. Add the members of the group.
          this.sessions[name].forEach(memberName => {
            sessions[memberName] = this.sessions[memberName];
          });
        } else {
          sessions[name] = this.sessions[name];
        }
      }
    });

    return sessions;
  }

  _loadSessions() {
    const config = this.getConfig();

    this.sessions = {};

    function createNodemiralSession(name, info) {
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

      return nodemiral.session(info.host, auth, opts);
    }

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
        // TODO: if server group, check if any servers in group are enabled
        continue;
      }

      const info = config.servers[name];

      if (typeof info.source === 'string') {
        const servers = this._serverGroupServers[name];
        servers.forEach(server => {
          const session = createNodemiralSession(
            server.name, server
          );
          this.sessions[server.name] = session;
        });
        this.sessions[name] = servers.map(s => s.name);
      } else {
        this.sessions[name] = createNodemiralSession(name, info);
      }
    }
  }

  _cleanupSessions() {
    log('cleaning up sessions');
    if (!this.sessions) {
      return;
    }

    Object.keys(this.sessions).forEach(key => {
      if (!Array.isArray(this.sessions[key])) {
        this.sessions[key].close();
      }
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
