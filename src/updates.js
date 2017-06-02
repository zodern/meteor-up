import Npm from 'silent-npm-registry-client';
import boxen from 'boxen';
import chalk from 'chalk';
import debug from 'debug';
import pkg from '../package.json';

let log = debug('mup:updates');

export default function() {
  log('checking for updates');
  return new Promise(function(resolve) {
    const params = {
      timeout: 1000,
      package: pkg.name,
      auth: {}
    };

    const npm = new Npm();
    const uri = 'https://registry.npmjs.org/npm';
    npm.distTags.fetch(uri, params, function(err, res) {
      if (err) {
        resolve();
        return;
      }

      const npmVersion = res.latest;
      const local = pkg.version.split('.').slice(0, 3).map(n => Number(n.split('-')[0]));
      const remote = npmVersion.split('.').map(n => Number(n.split('-')[0]));

      const beta = pkg.version.split('.')[2].split('-').length > 1;

      let available = remote[0] > local[0] ||
        remote[0] === local[0] && remote[1] > local[1] ||
        remote[1] === local[1] && remote[2] > local[2];

      if (beta && !available) {
        available = remote[0] === local[0] &&
         remote[1] === local[1] &&
         remote[2] === local[2];
      }

      if (available) {
        let text = `update available ${pkg.version} => ${npmVersion}`;
        text += `\nTo update, run ${chalk.green('npm i -g mup')}`;
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
