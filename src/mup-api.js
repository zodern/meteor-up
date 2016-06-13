import fs from 'fs';
import path from 'path';
import nodemiral from 'nodemiral';

export default class MupAPI {
  constructor(base, args) {
    this.base = base;
    this.args = args;
    this.config = null;
    this.settings = null;
    this.sessions = null;
  }

  getArgs() {
    return this.args;
  }

  getConfig() {
    if (!this.config) {
      const filePath = path.join(this.base, 'mup.js');
      try {
        this.config = require(filePath);
      } catch (e) {
        if(e.code == 'MODULE_NOT_FOUND') {
          console.error(`'mup.js' file not found. Run 'mup init' first.`);
        } else {
          console.error(e.message);
        }
        process.exit(1);
      }
    }

    return this.config;
  }

  getSettings() {
    if (!this.settings) {
      const filePath = path.join(this.base, 'settings.json');
      try {
        this.settings = require(filePath);
      } catch (e) {
        if(process.env.METEOR_SETTINGS) {
          this.settings = JSON.parse(process.env.METEOR_SETTINGS);
        } else {
          console.error(`No Meteor Settings found, set 'METEOR_SETTINGS' environment variable or ensure a '%s' exists.`, filePath);
          process.exit(1);
        }
      }
    }
    return this.settings;
  }

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
      const auth = {username: info.username};
      const opts = {ssh: {}};

      var sshAgent = process.env.SSH_AUTH_SOCK;

      if (info.opts) {
        opts.ssh = info.opts;
      }

      if (info.pem) {
        auth.pem = fs.readFileSync(path.resolve(info.pem), 'utf8');
      } else if (info.password) {
        auth.password = info.password;
      } else if (sshAgent && fs.existsSync(sshAgent)) {
        opts.ssh.agent = sshAgent;
      } else {
        console.error(
          'error: server %s doesn\'t have password, ssh-agent or pem',
          name
        );
        process.exit(1);
      }

      const session = nodemiral.session(info.host, auth, opts);
      this.sessions[name] = session;
    }
  }
}
