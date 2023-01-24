import state from './state';
import { addStartAppTask, checkAppStarted, getSessions, getVersions } from './utils';

// After a failed deploy, ensure all servers are running the same version
export async function rollback(api) {
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();
  const sessions = await getSessions(api);
  const versions = await getVersions(api);

  if (versions.servers.length === 1) {
    // There are no other servers to make sure it is consistent with
    return;
  }

  // The servers that are running the new version, and are able to rollback
  // to the previous version
  const toRollback = versions.servers.filter(server => {
    if (server.current !== state.deployingVersion) {
      return false;
    }

    if (server.previous && privateDockerRegistry) {
      return true;
    }

    // Make sure the server has the previous version
    return server.versions.includes(server.previous);
  });

  function getSession(server) {
    return sessions.find(session => session._host === server.host);
  }

  // TODO: when there two servers, make sure the app is available on the other
  // server first. Otherwise, we might restart the only running instance of the
  // app, causing downtime

  // TODO: if all servers have the same current version, do nothing since
  // it indicates the meteor-deploy-check script never never rolled back to
  // the old version (we don't know if the app version is bad, or there was
  // a connection issue or some other problem with the last server).

  let list = new QuietList();
  for (const server of toRollback) {
    const session = getSession(server);
    if (session) {
      // Remove the failed version from history so we don't roll back to it
      await api.runSSHCommand(
        session,
        [
          `head -n -1 /opt/${appConfig.name}/config/version-history.txt > /opt/${appConfig.name}/config/version-history.tmp.txt`,
          `mv /opt/${appConfig.name}/config/version-history.tmp.txt /opt/${appConfig.name}/config/version-history.txt`
        ].join('; ')
      );
      let version = server.previous;
      addStartAppTask(list, api, { isDeploy: false, version });
      checkAppStarted(list, api);
      try {
        console.log(`  - ${server.name}: rolling back to previous version...`);
        await list.run(session);
        console.log(`  - ${server.name}: rolled back successfully`);
      } catch (e) {
        console.log(`  - ${server.name}: failed rolling back`);
      }
    }
  }
}

class QuietList {
  constructor() {
    this.list = [];
  }

  executeScript(name, { script, vars }) {
    this.list.push({ script, vars });
  }

  _run(session, script, vars) {
    return new Promise((resolve, reject) => {
      session.executeScript(script, {
        vars
      }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async run(session) {
    let list = this.list;
    this.list = [];

    for (const entry of list) {
      await this._run(session, entry.script, entry.vars);
    }
  }
}
