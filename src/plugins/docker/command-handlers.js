import { difference, intersection } from 'lodash';

import chalk from 'chalk';
import debug from 'debug';
import { each } from 'async';
import nodemiral from 'nodemiral';

const log = debug('mup:module:docker');

function uniqueSessions(api) {
  const sessions = api.getSessions(['app', 'mongo', 'proxy']);
  return sessions.reduce(
    (prev, curr) => {
      if (prev.map(session => session._host).indexOf(curr._host) === -1) {
        prev.push(curr);
      }
      return prev;
    },
    []
  );
}

export function setup(api) {
  log('exec => mup docker setup');
  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('Setup Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-setup.sh')
  });

  const sessions = uniqueSessions(api);
  return api
    .runTaskList(list, sessions, { verbose: api.verbose })
    .then(() => setupSwarm(api));
}

export async function setupSwarm(api) {
  const config = api.getConfig();
  const swarmConfig = config.swarm;
  if (!swarmConfig) {
    return;
  }

  let serverInfo = await api.getServerInfo();

  let currentManagers = [];
  let wantedManagers = [];

  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];

    if (server.swarm && server.swarm.LocalNodeState !== 'inactive') {
      currentManagers.push(server._hot);
    }
  });

  Object.keys(swarmConfig.managers).forEach(manager => {
    wantedManagers.push(config.servers[manager].host);
  });

  const managersToAdd = difference(wantedManagers, currentManagers);
  const managersToRemove = difference(currentManagers, wantedManagers);
  const managersToKeep = intersection(currentManagers, wantedManagers);

  if (currentManagers.length === 0) {
    const list = nodemiral.taskList('Setting Up Docker Swarm');
    managersToKeep.push(managersToAdd.shift());
    list.executeScript('Creating Manager', {
      script: api.resolvePath(__dirname, 'assets/init-swarm.sh'),
      vars: {
        host: managersToKeep[0]
      }
    });
    let sessions = uniqueSessions(api).filter(session => session._host === managersToKeep[0]);
    await api.runTaskList(list, sessions, { verbose: true });
    serverInfo = await api.getServerInfo();
  }

  const nodeIdToHost = {};
  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];
    if (server.swarm) {
      nodeIdToHost[server.swarm.NodeID] = key;
    }
  });

  const currentNodes = [];
  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];
    if (server.swarmNodes === null || currentNodes.length > 0) {
      return;
    }

    server.swarmNodes.forEach(node => {
      currentNodes.push(nodeIdToHost[node.ID]);
    });
  });

  const wantedNodes = Object.keys(config.servers).map(server => config.servers[server].host);

  const nodesToAdd = difference(wantedNodes, currentNodes);

  console.log(currentNodes);
  console.log('adding nodes', nodesToAdd);

  const sessions = api.getSessionsForHosts(nodesToAdd);
  const list = nodemiral.taskList('Add nodes to swarm');
  const token = Object.keys(serverInfo).reduce((result, item) => result ? result : serverInfo[item].swarmToken, null);
  list.executeScript('Joining node', {
    script: api.resolvePath(__dirname, 'assets/swarm-join.sh'),
    vars: {
      token,
      managerIP: wantedManagers[0]
    }
  });

  await api.runTaskList(list, sessions);
}

export function restart(api) {
  const list = nodemiral.taskList('Restart Docker Daemon');

  list.executeScript('Restart Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-restart.sh')
  });

  const sessions = uniqueSessions(api);

  return api.runTaskList(list, sessions, { verbose: api.verbose });
}

export function ps(api) {
  let args = api.getArgs();
  args.shift();
  each(uniqueSessions(api), (session, cb) => {
    session.execute(`sudo docker ${args.join(' ')} 2>&1`, (err, code, logs) => {
      console.log(chalk.magenta(`[${session._host}]`) + chalk.blue(` docker ${args.join(' ')}`));
      console.log(logs.stdout);
      cb();
    });
  });
}
