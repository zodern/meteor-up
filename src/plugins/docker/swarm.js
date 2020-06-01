import {
  findKey,
  isEqual,
  partial
} from 'lodash';
import debug from 'debug';
import nodemiral from '@zodern/nodemiral';

const log = debug('mup:docker:swarm');

export function findNodeId(nodeIDs, serverName) {
  return findKey(nodeIDs, partial(isEqual, serverName));
}

export function swarmErrorSuggestions(err) {
  if (err.message.indexOf('certificate has expired or is not yet valid') > -1) {
    err.solution = 'Make sure the servers all have the same time.';
  }

  throw err;
}

export function executeSwarmTaskList(list, manager, api) {
  const servers = manager instanceof Array ? manager : [manager];
  const sessions = api.getSessionsForServers(servers);

  return api
    .runTaskList(list, sessions, { verbose: api.getVerbose() })
    .catch(swarmErrorSuggestions);
}

export function initSwarm(manager, host, api) {
  const list = nodemiral.taskList('Setting Up Docker Swarm');

  log('creating manager', manager);
  list.executeScript('Creating Manager', {
    script: api.resolvePath(__dirname, 'assets/init-swarm.sh'),
    vars: {
      host
    }
  });

  return executeSwarmTaskList(list, manager, api);
}

export function promoteNodes(manager, nodeIds, api) {
  const list = nodemiral.taskList('Promoting Nodes to Managers');

  log('promoting nodes:', nodeIds);
  list.executeScript('Promoting Nodes', {
    script: api.resolvePath(__dirname, 'assets/swarm-promote.sh'),
    vars: {
      nodeIds
    }
  });

  return executeSwarmTaskList(list, manager, api);
}

export function demoteManagers(manager, nodeIds, api) {
  const list = nodemiral.taskList('Demoting Swarm Managers');

  log('demoting nodes:', nodeIds, manager);

  list.executeScript('Demoting Managers', {
    script: api.resolvePath(__dirname, 'assets/swarm-demote.sh'),
    vars: {
      nodeIds
    }
  });

  return executeSwarmTaskList(list, manager, api);
}

export function joinNodes(servers, token, managerIP, api) {
  const list = nodemiral.taskList('Add Swarm Nodes');

  list.executeScript('Joining node', {
    script: api.resolvePath(__dirname, 'assets/swarm-join.sh'),
    vars: {
      token,
      managerIP
    }
  });

  return executeSwarmTaskList(list, servers, api);
}

export function diffLabels(currentLabels, desiredLabels) {
  const toRemove = [];
  const toAdd = [];
  const knownLabels = Object.values(desiredLabels).reduce((result, labels) => {
    result.push(...Object.keys(labels));

    return result;
  }, []);

  // check for labels to add or update
  Object.keys(desiredLabels).forEach(server => {
    for (const [label, value] of Object.entries(desiredLabels[server])) {
      if (!currentLabels[server] || currentLabels[server][label] !== value) {
        toAdd.push({ server, label, value });
      }
    }
  });

  // check for labels no longer used
  Object.keys(currentLabels).forEach(server => {
    for (const [label] of Object.entries(currentLabels[server])) {
      if (!knownLabels.includes(label)) {
        // Only remove labels that mup knows about from plugins
        continue;
      }
      if (!desiredLabels[server] || !(label in desiredLabels[server])) {
        toRemove.push({ server, label });
      }
    }
  });

  return { toRemove, toAdd };
}

export function updateLabels(api, manager, toAdd, toRemove) {
  const list = nodemiral.taskList('Update Swarm Labels');

  log(`Adding labels ${JSON.stringify(toAdd)}`);

  list.executeScript('Update Labels', {
    script: api.resolvePath(__dirname, 'assets/swarm-labels.sh'),
    vars: {
      toAdd,
      toRemove
    }
  });

  return executeSwarmTaskList(list, manager, api);
}
