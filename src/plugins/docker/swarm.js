import nodemiral from 'nodemiral';

export function initSwarm(managers, host, api) {
  const list = nodemiral.taskList('Setting Up Docker Swarm');
  const sessions = api.getSessionsForServers(managers);

  list.executeScript('Creating Manager', {
    script: api.resolvePath(__dirname, 'assets/init-swarm.sh'),
    vars: {
      host
    }
  });

  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function promoteNodes(manager, nodeIds, api) {
  const list = nodemiral.taskList('Promoting Nodes to Managers');
  const sessions = api.getSessionsForServers([manager]);

  list.executeScript('Promoting Node', {
    script: api.resolvePath(__dirname, 'assets/swarm-promote.sh'),
    vars: {
      nodeIds
    }
  });

  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function removeManagers(managers, api) {
  const list = nodemiral.taskList('Removing Swarm Managers');
  const sessions = api.getSessionsForServers(managers);

  list.executeScript('Removing Managers', {
    scripts: api.resolvePath(__dirname, 'assets/swarm-leave.sh')
  });

  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function joinNodes(servers, token, managerIP, api) {
  const list = nodemiral.taskList('Add Swarm Nodes');
  const sessions = api.getSessionsForServers(servers);

  list.executeScript('Joining node', {
    script: api.resolvePath(__dirname, 'assets/swarm-join.sh'),
    vars: {
      token,
      managerIP
    }
  });

  return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function diffLabels(currentLabels, desiredLabels) {
  const toRemove = [];
  const toAdd = [];

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
      if (!desiredLabels[server] || !(label in desiredLabels[server])) {
        toRemove.push({ server, label });
      }
    }
  });

  return { toRemove, toAdd };
}

export function updateLabels(api, manager, toAdd, toRemove) {
  const list = nodemiral.taskList('Update Swarm Labels');
  const session = api.getSessionsForServers([manager]);

  list.executeScript('Update Labels', {
    script: api.resolvePath(__dirname, 'assets/swarm-labels.sh'),
    vars: {
      toAdd,
      toRemove
    }
  });

  return api.runTaskList(list, session, { verbose: api.getVerbose() });
}
