import {
  flatMap,
  isEqual
} from 'lodash';
import axios from 'axios';
import boxen from 'boxen';
import chalk from 'chalk';
import debug from 'debug';
import path from 'path';

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

function showUpdateOnExit(pkg, version, isStable) {
  const command = isStable ? `npm i -g ${pkg.name}` : `npm i -g ${pkg.name}@next`;
  let text = `Update available for ${pkg.name}`;
  text += `\n${pkg.version} => ${version}`;

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

function checkPackageUpdates(name, pkg) {
  log(`retrieving tags for ${name}`);

  return axios.get(`https://registry.npmjs.org/-/package/${name}/dist-tags`)
    .then(({ data }) => {
      const npmVersion = data.latest || '0.0.0';
      const nextVersion = data.next || '0.0.0';

      const local = parseVersion(pkg.version);
      const remote = parseVersion(npmVersion);
      const next = parseVersion(nextVersion);

      const {
        available,
        isStable
      } = compareVersions(local, remote, next);

      log(`finished update check for ${name}`);
      if (available) {
        showUpdateOnExit(pkg, isStable ? npmVersion : nextVersion, isStable);
      }
    }).catch(e => {
      // It is okay if this fails
      log(e);
    });
}

export default function(packages) {
  log('checking for updates');
  log('Packages: ', packages);

  if (SKIP_CHECK_UPDATE) {
    log('skipping update check');

    return;
  }

  packages.forEach(({ name, path: packagePath }) => {
    try {
      const packageJsonPath = path.resolve(path.dirname(packagePath), 'package.json');
      // eslint-disable-next-line global-require
      const pkg = require(packageJsonPath);
      checkPackageUpdates(name, pkg);
    } catch (e) {
      // It is okay if this fails
      log(e);
    }
  });
}
