import {
  flatMap,
  isEqual
} from 'lodash';
import axios from 'axios';
import boxen from 'boxen';
import chalk from 'chalk';
import debug from 'debug';
import pkg from '../package.json';

const log = debug('mup:updates');
const SKIP_CHECK_UPDATE = process.env.MUP_SKIP_UPDATE_CHECK === 'true';

function parseVersion(version) {
  return flatMap(version.split('.'), n =>
    n.split('-beta').filter(segment => segment.length > 0).map(Number)
  );
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

  if (SKIP_CHECK_UPDATE) {
    log('skipping update check');

    return;
  }


  return axios.get(`https://registry.npmjs.org/-/package/${pkg.name}/dist-tags`)
    .then(({ data }) => {
      const npmVersion = data.latest;
      const nextVersion = data.next;

      const local = parseVersion(pkg.version);
      const remote = parseVersion(data.latest);
      const next = parseVersion(data.next);

      const {
        available,
        isStable
      } = compareVersions(local, remote, next);

      log('finished update check');
      if (available) {
        showUpdateOnExit(isStable ? npmVersion : nextVersion, isStable);
      }
    }).catch(() => {
      // It is okay if this fails
    });
}
