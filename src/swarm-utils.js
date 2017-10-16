export function findManagers(serverInfo) {
  const hosts = [];

  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];

    if (server.swarm && server.swarm.LocalNodeState !== 'inactive') {
      hosts.push(key);
    }
  });

  return hosts;
}

export function findNodes(serverInfo) {
  const nodes = [];
  const managers = findManagers(serverInfo);

  if (managers.length === 0) {
    return nodes;
  }

  const manager = managers[0];
  const nodeIds = serverInfo[manager].nodes.map(node => node.ID);
}
