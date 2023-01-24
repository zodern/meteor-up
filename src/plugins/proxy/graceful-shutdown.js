import { PROXY_CONTAINER_NAME } from './command-handlers';
import { getLoadBalancingHosts, getSessions } from './utils';

function runScript(sessions, script, vars) {
  const promises = sessions.map(session =>
    new Promise((resolve, reject) => {
      session.executeScript(script, {
        vars
      }, (err, code, output) => {
        console.log(err, code, output);
        if (code > 0) {
          return reject(output);
        }

        resolve();
      });
    }));

  return Promise.all(promises);
}

function updateUpstreams(api, toDrain) {
  const {
    app: appConfig,
    proxy: config
  } = api.getConfig();
  const hostnames = getLoadBalancingHosts(
    api.expandServers(appConfig.servers),
    toDrain ? [toDrain] : undefined
  );
  const domains = config.domains.split(',');

  const proxySessions = getSessions(api);

  // TODO: we don't need to update the domains
  return runScript(
    proxySessions,
    api.resolvePath(__dirname, 'assets/upstream.sh'),
    {
      domains,
      name: appConfig.name,
      setUpstream: !api.swarmEnabled() && config.loadBalancing,
      stickySessions: config.stickySessions !== false,
      proxyName: PROXY_CONTAINER_NAME,
      port: appConfig.env.PORT,
      hostnames
    }
  );
}

export async function gracefulShutdown(api, { session }) {
  console.log('graceful shutdown');
  const {
    proxy
  } = api.getConfig();

  if (!proxy || !proxy.loadBalancing) {
    return;
  }

  await updateUpstreams(api, session._host);
}

export async function readdInstance(api) {
  const {
    proxy
  } = api.getConfig();

  if (!proxy || !proxy.loadBalancing) {
    return;
  }

  await updateUpstreams(api);
}
