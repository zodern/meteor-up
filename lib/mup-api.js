import fs from 'fs';
import path from 'path';
import nodemiral from 'nodemiral';

export default class MupAPI {
  constructor(base, args) {
    this.base = base;
    this.args = args;
    this.config = null;
    this.settings = null;
    this.sessions = {
      _ready: false,
      meteor: [],
      mongo: [],
      proxy: [],
    };
  }

  getArgs() {
    return this.args;
  }

  getConfig() {
    if (!this.config) {
      const filePath = path.join(this.base, 'mup.js');
      this.config = require(filePath);
    }

    return this.config;
  }

  getSettings() {
    if (!this.settings) {
      const filePath = path.join(this.base, 'settings.json');
      this.settings = require(filePath);
    }

    return this.settings;
  }

  getSessions(modules = []) {
    if (!this.sessions._ready) {
      this._loadSessions();
      this.sessions._ready = true;
    }

    return modules.reduce((sessions, name) => {
      sessions.push(...this.sessions[name]);
      return sessions;
    }, []);
  }

  withSessions(modules = []) {
    if (!this.sessions._ready) {
      this._loadSessions();
      this.sessions._ready = true;
    }

    const api = Object.create(this);
    api.sessions = {_ready: true};
    modules.forEach(name => api.sessions[name] = this.sessions[name]);
    return api;
  }

  _loadSessions() {
    const config = this.getConfig();
    const servers = {};

    // `mup.servers` contains login information for servers
    // Use this information to create nodemiral sessions.
    for (var name in config.servers) {
      if (!config.servers.hasOwnProperty(name)) {
        continue;
      }

      const info = config.servers[name];
      const auth = {username: info.user};
      const opts = {ssh: {}};

      if (info.pem) {
        auth.pem = fs.readFileSync(path.resolve(info.pem), 'utf8');
      } else if (info.pass) {
        auth.password = info.pass;
      } else {
        console.error('error: server %s doesn\'t have password or pem', name);
        process.exit(1);
      }

      if (info.opts) {
        opts.ssh = info.opts;
      }

      const session = nodemiral.session(info.host, auth, opts);
      servers[name] = session;
    }

    // Group nodemiral sessions by modules.
    Object.keys(this.sessions).forEach(module => {
      const moduleConfig = config[module];
      if (!moduleConfig) {
        return;
      }

      if (!moduleConfig.servers) {
        // TODO no servers for module
        // should this throw an error?
        return;
      }

      const modServers = Object.keys(moduleConfig.servers);
      this.sessions[module] = modServers.map(modName => servers[modName]);
    });
  }
}
