import boxen from 'boxen';
import chalk from 'chalk';
import debug from 'debug';
import Npm from 'silent-npm-registry-client';
import pkg from '../package.json';

const log = debug('mup:updates');

export default function() {
  log('checking for updates');

  return new Promise(resolve => {
    const params = {
      timeout: 1000,
      package: pkg.name,
      auth: {}
    };

    const npm = new Npm();
    const uri = 'https://registry.npmjs.org/npm';
    npm.distTags.fetch(uri, params, (err, res) => {
      if (err) {
        resolve();

        return;
      }

      let showStable = true;

      const npmVersion = res.latest;
      const nextVersion = res.next;

      const local = pkg.version.split('.').slice(0, 3)
        .map(n => Number(n.split('-')[0]));
      const remote = npmVersion.split('.').map(n => Number(n.split('-')[0]));
      const next = nextVersion.split('.').map(n => Number(n.split('-')[0]));
      next.push(nextVersion.split('.')[2].split('beta')[1]);

      const beta = pkg.version.split('.')[2].split('-').length > 1;

      if (beta) {
        local.push(pkg.version.split('.')[2].split('beta')[1]);
      }

      let available = remote[0] > local[0] ||
        remote[0] === local[0] && remote[1] > local[1] ||
        remote[1] === local[1] && remote[2] > local[2];

      if (beta && !available) {
        // check if stable for beta is available
        available = remote[0] === local[0] &&
          remote[1] === local[1] &&
          remote[2] === local[2];
      }

      if (beta && !available) {
        available = next[3] > local[3];
        showStable = false;
      }

      if (available) {
        const version = showStable ? npmVersion : nextVersion;
        const command = showStable ? 'npm i -g mup' : 'npm i -g mup@next';

        let text = `update available ${pkg.version} => ${version}`;
        text += `\nTo update, run ${chalk.green(command)}`;
        console.log(
          boxen(text, {
            padding: 1,
            margin: 1,
            align: 'center',
            borderColor: 'yellow'
          })
        );
      }

      resolve();
    });
  });
}
