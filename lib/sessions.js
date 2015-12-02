import nodemiral from 'nodemiral';
import {getConfig} from './configs';

let ready = false;
const modules = {
  meteor: [],
  mongo: [],
  proxy: [],
};

const ALL_MODULES = Object.keys(modules);

export function getSessions(moduleNames = ALL_MODULES) {
  if (!ready) {
    loadSessions();
    ready = true;
  }

  const sessions = [];
  moduleNames.forEach(name => {
    sessions.push(...modules[name]);
  });

  return sessions;
}

export function loadSessions() {
  const config = getConfig();
  const servers = config.mup.servers;
  const sessions = {};

  // `mup.servers` contains login information for servers
  // Use this information to create nodemiral sessions.
  for (var name in servers) {
    if (!servers.hasOwnProperty(name)) {
      continue;
    }

    const server = servers[name];
    const host = server.host;
    const auth = {username: server.user};
    const opts = {ssh: {}};

    if (server.pem) {
      auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
    } else if (server.pass) {
      auth.password = server.pass;
    } else {
      console.error('error: server %s doesn\'t have password or pem', name);
      process.exit(1);
    }

    if (server.port) {
      opts.ssh.port = server.port;
    }

    const session = nodemiral.session(host, auth, {opts});
    sessions[name] = session;
  }

  // Group nodemiral sessions by modules.
  Object.keys(modules).forEach(module => {
    const moduleConfig = config.mup[module];
    if (!moduleConfig) {
      return;
    }

    if (!moduleConfig.servers) {
      // TODO no servers for module
      // should this throw an error?
      return;
    }

    const moduleServers = Object.keys(moduleConfig.servers);
    modules[module] = moduleServers.map(name => sessions[name]);
  });
}
