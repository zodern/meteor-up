import Npm from 'silent-npm-registry-client';
import pkg from '../package.json';

export default function () {
  return new Promise(function (resolve, reject) {
    const params = {
      timeout: 1000,
      package: pkg.name,
      auth: {},
    };

    const npm = new Npm();
    const uri = 'https://registry.npmjs.org/npm';
    npm.distTags.fetch(uri, params, function (err, res) {
      if (err) {
        resolve();
        return;
      }

      const npmVersion = res.latest;
      const local = pkg.version.split('.').map(n => Number(n));
      const remote = npmVersion.split('.').map(n => Number(n));

      const available = remote[0] > local[0] ||
      (remote[0] === local[0] && remote[1] > local[1]) ||
      (remote[1] === local[1] && remote[2] > local[2]);

      if (available) {
        console.log('update %s => %s', pkg.version, npmVersion);
      }

      resolve();
    });
  });
}
