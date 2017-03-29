import chalk from 'chalk';
import fs from 'fs';
import nodemiral from 'nodemiral';
import parseJson from 'parse-json';
import { resolvePath } from './modules/utils';
import configValidator from './validate/index';
import { argv } from 'yargs';

export let _config = null;
export let _settings = null;
export let sessions = null;

export function getBasePath() {
  return process.cwd();
}

export function getArgs() {
  return process.argv.slice(2);
}

export function validateConfig(configPath) {
  let problems = configValidator(_config);
  if (problems.length > 0) {
    let red = chalk.red;
    let plural = problems.length > 1 ? 's' : 's';

    console.log(`loaded mup.js from ${configPath}`);
    console.log('');
    console.log(red(`${problems.length} Validation Error${plural}`));

    problems.forEach(problem => {
      console.log(red(`  - ${problem}`));
    });

    console.log('');
    console.log('If you think there is a bug in the mup.js validator, please');
    console.log('create an issue at https://github.com/zodern/meteor-up');
    console.log('');
  }
}

export function getConfig() {
  if (!_config) {
    let filePath;
    if (argv.config) {
      filePath = argv.config;
    } else {
      filePath = resolvePath(getBasePath(), 'mup.js');
    }
    try {
      _config = require(filePath); // eslint-disable-line global-require
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.error('"mup.js" file not found. Run "mup init" to create it.');
      } else {
        console.error(e);
      }
      process.exit(1);
    }
    validateConfig(filePath);
  }
  return _config;
}

export function getSettingsPath() {
  return argv.settings || resolvePath(getBasePath(), 'settings.json');
}

export function getSettings() {
  if (!_settings) {
    let filePath = getSettingsPath();
    let content;
    try {
      content = fs.readFileSync(filePath).toString();
    } catch (e) {
      console.log(`Unable to load settings.json at ${filePath}`);
      if (e.code !== 'ENOENT') {
        console.log(e);
      }
      process.exit(1);
    }
    try {
      _settings = parseJson(content);
    } catch (e) {
      console.log('Error parsing settings file:');
      console.log(e.message);
      process.exit(1);
    }
  }
  return _settings;
}

export function getSessions(modules = []) {
  const _sessions = pickSessions(modules);
  // convert to array
  return Object.keys(_sessions).map(name => _sessions[name]);
}

function pickSessions(modules = []) {
  if (!sessions) {
    loadSessions();
  }

  const _sessions = {};

  modules.forEach(moduleName => {
    const moduleConfig = _config[moduleName];
    if (!moduleConfig) {
      return;
    }

    for (var name in moduleConfig.servers) {
      if (!moduleConfig.servers.hasOwnProperty(name)) {
        continue;
      }

      if (sessions[name]) {
        _sessions[name] = sessions[name];
      }
    }
  });

  return _sessions;
}

function loadSessions() {
  const config = getConfig();
  sessions = {};

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

    const _session = nodemiral.session(info.host, auth, opts);
    sessions[name] = _session;
  }
}
