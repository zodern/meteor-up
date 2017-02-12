import fs from 'fs';
import nodemiral from 'nodemiral';
import parseJson from 'parse-json';
import path from 'path';
import { resolvePath } from './modules/utils';
import validateConfig from './validate/index';

export default class MupAPI {
  constructor(base, args, configPath, settingsPath) {
    this.base = base;
    this.args = args;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this.configPath = configPath;
    this.settingsPath = settingsPath;
  }

  getArgs() {
    return this.args;
  }

  getBasePath() {
    return this.base;
  }

  validateConfig(configPath) {
    let valid = validateConfig(this.config);

    let invalid = valid.errors.length > 0 || valid.warnings.length > 0;

    if (invalid) {
      console.log(`loaded mup.js from ${configPath}`);
    }

    if (valid.errors.length > 0) {
      console.log(`mup.js has ${valid.errors.length} errors:`);
      valid.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    if (valid.warnings.length > 0) {
      console.log(`mup.js has ${valid.warnings.length} warnings:`);
      valid.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    if (invalid) {
      console.log(
        'If you think there is a bug in the mup.js validator, please'
      );
      console.log('create an issue at https://github.com/zodern/meteor-up');
    }
  }

  getConfig() {
    if (!this.config) {
      let filePath;
      if (this.configPath) {
        filePath = resolvePath(this.configPath);
        this.base = path.dirname(this.configPath);
      } else {
        filePath = path.join(this.base, 'mup.js');
      }
      try {
        this.config = require(filePath);
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          console.error('"mup.js" file not found. Run "mup init" first.');
        } else {
          console.error(e);
        }
        process.exit(1);
      }
      this.validateConfig(filePath);
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
      const auth = { username: info.username };
      const opts = { ssh: {} };

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
