import { checkVersion, shouldShowDockerWarning } from './utils';
import {
  curry,
  difference,
  intersection
} from 'lodash';
import {
  demoteManagers,
  diffLabels,
  findNodeId,
  initSwarm,
  joinNodes,
  promoteNodes,
  updateLabels
} from './swarm';

import chalk from 'chalk';
import debug from 'debug';
import { map } from 'bluebird';
import nodemiral from '@zodern/nodemiral';

const log = debug('mup:module:docker');

function uniqueSessions(api) {
  const { servers } = api.getConfig();
  const sessions = api.getSessions(['app', 'mongo', 'proxy']);

  if (api.swarmEnabled()) {
    return api.getSessionsForServers(Object.keys(servers));
  }

  return sessions.reduce(
    (prev, curr) => {
      if (prev.map(session => session._host).indexOf(curr._host) === -1) {
        prev.push(curr);
      }

      return prev;
    }, []
  );
}

export function setup(api) {
  log('exec => mup docker setup');
  const config = api.getConfig();
  const swarmEnabled = api.swarmEnabled();
  const servers = Object.keys(config.servers || {});

  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('Setup Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-setup.sh'),
    vars: {
      privateRegistry: config.privateDockerRegistry
    }
  });

  const sessions = swarmEnabled ?
    api.getSessionsForServers(servers) :
    uniqueSessions(api);

  if (sessions.length === 0) {
    // There are no servers, so we can skip running the list
    return;
  }

  return api
    .runTaskList(list, sessions, {
      verbose: api.verbose
    })
    .then(() => setupSwarm(api));
}

export async function setupSwarm(api) {
  const config = api.getConfig();

  if (!api.swarmEnabled()) {
    return;
  }

  let serverInfo = await api.getServerInfo();
  const {
    currentManagers,
    desiredManagers
  } = await api.swarmInfo();

  log('currentManagers', currentManagers);
  log('wantedManagers', desiredManagers);

  const managersToAdd = difference(desiredManagers, currentManagers);
  const managersToRemove = difference(currentManagers, desiredManagers);

  // These managers are safe to run tasks on that require a manager
  // This array is modified as managers are added and removed
  const managersToKeep = intersection(currentManagers, desiredManagers);

  log('managers to add', managersToAdd);
  log('managers to remove', managersToRemove);
  log('managers keeping', managersToKeep);

  if (currentManagers.length === 0) {
    log('Creating swarm cluster');
    const host = config.servers[managersToAdd[0]].host;

    await initSwarm(managersToAdd[0], host, api);

    managersToKeep.push(managersToAdd.shift());
    log('finished creating cluster');
    api.serverInfoStale();
  } else if (managersToKeep.length === 0) {
    // We can run tasks on the managers being removed until
    // the new managers are added
    managersToKeep.push(managersToRemove[0]);
  }

  // refresh server info after updating managers
  serverInfo = await api.getServerInfo();

  const {
    nodes: currentNodes,
    currentLabels,
    desiredLabels
  } = await api.swarmInfo();
  const wantedNodes = Object.keys(config.servers);
  const nodesToAdd = difference(wantedNodes, currentNodes);

  log('current nodes', currentNodes);
  log('adding nodes', nodesToAdd);

  if (nodesToAdd.length > 0) {
    const token = Object.keys(serverInfo)
      .reduce((result, item) => result || serverInfo[item].swarmToken, null);
    const managerIP = config.servers[desiredManagers[0]].host;

    await joinNodes(nodesToAdd, token, managerIP, api);
    api.serverInfoStale();
  }

  const {
    nodeIDs
  } = await api.swarmInfo();
  const curriedFindNodeId = curry(findNodeId)(nodeIDs);

  log('remaining managers to add', managersToAdd);
  if (managersToAdd.length > 0) {
    const managerIDs = managersToAdd
      .map(curriedFindNodeId);

    await promoteNodes(managersToKeep[0], managerIDs, api);

    if (managersToKeep[0] === managersToRemove[0]) {
      // There were no managers being kept, so we were only able
      // to use the managers that will be removed. We can now use
      // the newly promoted managers.
      managersToKeep[0] = managersToAdd[0];
    }
  }

  if (managersToRemove.length > 0) {
    await demoteManagers(
      managersToKeep[0],
      managersToRemove.map(curriedFindNodeId),
      api
    );
    api.serverInfoStale();
  }

  // Update tags
  let { toRemove, toAdd } = diffLabels(currentLabels, desiredLabels);

  log('current labels', currentLabels);
  log('desired labels', desiredLabels);
  log('adding labels', toAdd);
  log('removing labels', toRemove);

  if (toRemove.length > 0 || toAdd.length > 0) {
    toRemove = toRemove.map(data => {
      data.node = curriedFindNodeId(data.server);

      if (!data.node) {
        console.error(`Unable to remove "${data.label}" label for server "${data.server}": Server doesn't have a node id.`);
      }

      return data;
    });

    toAdd = toAdd.map(data => {
      data.node = curriedFindNodeId(data.server);

      if (!data.node) {
        console.log(`Unable to update "${data.label}" label for server "${data.server}": Server doesn't have a node id.`);
      }

      return data;
    });

    await updateLabels(api, managersToKeep[0], toAdd, toRemove);
  }
}

export function restart(api) {
  const list = nodemiral.taskList('Restart Docker Daemon');

  list.executeScript('Restart Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-restart.sh')
  });

  const sessions = uniqueSessions(api);

  return api.runTaskList(list, sessions, {
    verbose: api.verbose
  });
}

export function removeSwarm(api) {
  const list = nodemiral.taskList('Destroy Swarm Cluster');
  const servers = Object.keys(api.getConfig().servers);
  const sessions = api.getSessionsForServers(servers);

  list.executeScript('Leave Swarm Cluster', {
    script: api.resolvePath(__dirname, 'assets/swarm-leave.sh')
  });

  return api.runTaskList(list, sessions, {
    verbose: api.verbose
  });
}

export async function ps(api) {
  const args = api.getArgs();

  args.shift();
  const sessions = uniqueSessions(api);

  for (const session of sessions) {
    await api.runSSHCommand(session, `sudo docker ${args.join(' ')} 2>&1`).then(({ output, host }) => {
      console.log(chalk.magenta(`[${host}]`) + chalk.blue(` docker ${args.join(' ')}`));
      console.log(output);
    });
  }
}

export async function status(api) {
  const config = api.getConfig();
  const swarmEnabled = api.swarmEnabled();

  if (!config.servers) {
    return;
  }

  const results = await map(
    Object.values(config.servers),
    server => api.runSSHCommand(server, 'sudo docker version --format "{{.Server.Version}}"'),
    { concurrency: 2 }
  );

  const lines = [];
  const versions = [];
  let overallColor = chalk.green;

  results.forEach(result => {
    let dockerStatus = 'Running';
    let color = 'green';

    if (result.code === 1) {
      dockerStatus = 'Stopped';
      color = 'red';
      overallColor = chalk.red;
    } else if (result.code === 127) {
      dockerStatus = 'Not installed';
      color = 'red';
      overallColor = chalk.red;
    }

    const version = result.output.trim().length > 1 ? result.output.trim() : '';
    let versionColor = chalk.green;

    if (!checkVersion(version)) {
      overallColor = chalk.red;
      versionColor = chalk.red;
    }

    versions.push({
      version,
      host: result.host
    });

    lines.push(` - ${result.host}: ${versionColor(version)} ${chalk[color](dockerStatus)}`);
  });


  console.log(overallColor('\n=> Docker Status'));
  if (shouldShowDockerWarning(versions)) {
    console.log(` - ${chalk.yellow('All Dockers don\'t have the same version')}`);
  }
  console.log(lines.join('\n'));

  if (!swarmEnabled) {
    return;
  }

  const { currentManagers, nodes } = await api.swarmInfo();
  const list = [];

  currentManagers.forEach(manager => {
    list.push(` - ${manager} (Manager)`);
  });

  difference(nodes, currentManagers).forEach(node => {
    list.push(` - ${node || 'Unknown server'}`);
  });

  if (currentManagers.length === 0) {
    console.log('No swarm managers');

    return;
  }

  // TODO: show swarm health:
  // https://docs.docker.com/engine/swarm/admin_guide/#monitor-swarm-health

  console.log(`Swarm Nodes: ${nodes.length}`);
  console.log(list.join('\n'));
}

export async function update(api) {
  const config = api.getConfig();
  const swarmEnabled = api.swarmEnabled();
  const servers = Object.keys(config.servers);

  const list = nodemiral.taskList('Update Docker');

  list.executeScript('Update Docker', {
    script: api.resolvePath(__dirname, 'assets/docker-update.sh')
  });

  const sessions = swarmEnabled ?
    api.getSessionsForServers(servers) :
    uniqueSessions(api);

  return api.runTaskList(list, sessions, {
    verbose: api.verbose
  })
    .then(() => setupSwarm(api));
}
