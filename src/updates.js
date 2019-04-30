import {
  flatMap,
  isEqual
} from 'lodash';
import boxen from 'boxen';
import chalk from 'chalk';
import debug from 'debug';
import Npm from 'silent-npm-registry-client';
import pkg from '../package.json';

const log = debug('mup:updates');
const SKIP_CHECK_UPDATE = process.env.MUP_SKIP_UPDATE_CHECK === 'false';

function parseVersion(version) {
  return flatMap(version.split('.'), n => n.split('-beta').map(Number));
}

function newerStable(local, remote) {
  for (let i = 0; i < 3; i++) {
    for (let sameIndex = 0; sameIndex < i; sameIndex += 1) {
      if (local[sameIndex] !== remote[sameIndex]) {
        return false;
      }
    }

    if (local[i] < remote[i]) {
      return true;
    }
  }

  return false;
}

function compareVersions(local, remote, next) {
  const beta = local.length > 3;
  let isStable = true;
  let available = newerStable(local, remote);

  if (beta && !available) {
    // check if stable version for beta is available
    available = isEqual(remote, local.slice(0, 3));
  }

  if (beta && !available) {
    // check if newer beta is available
    available = next[3] > local[3];
    isStable = false;
  }

  return {
    available,
    isStable
  };
}

function showUpdateOnExit(version, isStable) {
  const command = isStable ? 'npm i -g mup' : 'npm i -g mup@next';
  let text = `update available ${pkg.version} => ${version}`;

  text += `\nTo update, run ${chalk.green(command)}`;

  process.on('exit', () => {
    console.log(
      boxen(text, {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'yellow'
      })
    );
  });
}

export default function() {
  log('checking for updates');

  return new Promise(resolve => {
    if (SKIP_CHECK_UPDATE) {
      log('skipping update check');

      return resolve();
    }

    const params = {
      package: pkg.name,
      auth: {}
    };

    const npm = new Npm();
    const uri = 'https://registry.npmjs.org/npm';

    npm.distTags.fetch(uri, params, (err, res) => {
      if (err) {
        return resolve();
      }

      const npmVersion = res.latest;
      const nextVersion = res.next;

      const local = parseVersion(pkg.version);
      const remote = parseVersion(res.latest);
      const next = parseVersion(res.next);

      const {
        available,
        isStable
      } = compareVersions(local, remote, next);

      log('finished update check');
      if (available) {
        showUpdateOnExit(isStable ? npmVersion : nextVersion, isStable);
      }

      resolve();
    });
  });
}
