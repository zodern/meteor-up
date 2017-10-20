import _ from 'lodash';
import debug from 'debug';
import { getOptions } from './swarm-options';

const log = debug('mup:swarm-utils');

export function hostsToServer(config, hosts) {
  const servers = config.servers;
  const result = [];

  Object.keys(servers).forEach(key => {
    const server = servers[key];

    if (hosts.indexOf(server.host) > -1) {
      result.push(key);
    }
  });

  return result;
}

export function currentManagers(config, serverInfo) {
  const hosts = [];

  // TODO: handle managers from multiple clusters. 

  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];

    if (
      server.swarm &&
      server.swarm.LocalNodeState !== 'inactive' &&
      server.swarm.Cluster
    ) {
      hosts.push(key);
    }
  });


  const result = hostsToServer(config, hosts);

  log('current managers', result);

  return result;
}

export function desiredManagers(config, serverInfo) {
  const { managers } = getOptions(config);
  let additionalManagers = 0;

  log('requrested managers', managers);

  if (managers.length === 0 || managers.length === 2 || managers.length === 4) {
    additionalManagers = 1;
  }

  log('additional managers', additionalManagers);

  // TODO: handle more than 5 managers
  // TODO: handle when there are 2 or 4 servers
  // TODO: When there are at least 3 servers, 
  // there should be at least 3 managers

  if (additionalManagers > 0) {
    const current = currentManagers(config, serverInfo);
    const diff = _.difference(current, managers);
    const managersToAdd = diff.splice(0, additionalManagers);

    log('managers to add', managersToAdd);
    additionalManagers -= managersToAdd.length;
    managers.push(...managersToAdd);
  }

  if (additionalManagers > 0) {
    const diff = _.difference(Object.keys(config.servers), managers);
    const managersToAdd = diff.splice(0, additionalManagers);
    log('random servers to add', managersToAdd);
    managers.push(...managersToAdd);
  }

  log('desired managers', managers);

  return managers;
}

export function findNodes(config, serverInfo) {
  const nodes = [];
  const managers = currentManagers(config, serverInfo);

  if (managers.length === 0) {
    return nodes;
  }

  // TODO: handle nodes that aren't listed in the config.server
  // TODO: handle multiple clusters

  const manager = config.servers[managers[0]].host;
  const ids = Object.keys(serverInfo).reduce((result, host) => {
    if (serverInfo[host].swarm) {
      const id = serverInfo[host].swarm.NodeID;
      result[id] = host;
    }

    return result;
  }, {});

  const nodeHosts = serverInfo[manager].swarmNodes.map(node => ids[node.ID]);


  return hostsToServer(config, nodeHosts);
}
