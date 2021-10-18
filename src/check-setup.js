/* eslint-disable no-labels */
const crypto = require('crypto');
const fs = require('fs');

const checkers = [];

export function registerChecker(checker) {
  checkers.push(checker);
}

function createKey(keyConfig = {}) {
  const finalConfig = {
    ...keyConfig
  };
  if (finalConfig.scripts) {
    finalConfig.scripts = finalConfig.scripts.map(
      path => fs.readFileSync(path, 'utf-8')
    );
  }

  return crypto.createHash('sha256')
    .update(JSON.stringify(finalConfig))
    .digest('base64');
}

export async function checkSetup(pluginApi) {
  const checks = await Promise.all(checkers.map(checker => checker(pluginApi)));

  console.time('setup check');
  const bySession = new Map();
  checks.flat().forEach(check => {
    let keyHash = createKey(check.setupKey);

    check.sessions.forEach(session => {
      const config = bySession.get(session) || {
        keyHashes: {},
        services: [],
        containers: []
      };

      config.keyHashes[check.name] = keyHash;
      config.services.push(...check.services || []);
      config.containers.push(...check.containers || []);
      bySession.set(session, config);
    });
  });

  const promises = [];

  bySession.forEach((config, session) => {
    console.log(session._host, config);
    const promise = new Promise(resolve => {
      session.executeScript(
        pluginApi.resolvePath(__dirname, './tasks/assets/check-setup.sh'),
        {
          vars: config
        },
        (err, code) => {
          resolve(!err && code === 0);
        }
      );
    });
    promises.push(promise);
  });

  const result = await Promise.all(promises);
  console.timeEnd('setup check');


  return result.every(upToDate => upToDate);
}

export async function updateSetupKeys(api) {
  const checks = await Promise.all(checkers.map(checker => checker(api)));

  // TODO: parallelize this
  for (const check of checks.flat()) {
    const setupKeyHash = createKey(check.setupKey);

    for (const session of check.sessions) {
      // TODO: handle errors. Should retry, and after 3 tries give up
      // Shouldn't throw since if the command fails mup will simply setup
      // again next time
      await api.runSSHCommand(
        session,
        `sudo mkdir -p /opt/.mup-setup && sudo echo "${setupKeyHash}" > /opt/.mup-setup/${check.name}.txt`
      );
    }
  }
}
