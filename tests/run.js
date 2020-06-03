/* eslint-disable no-var */

var sh = require('shelljs');
var path = require('path');
var argv = require('yargs').argv;

console.log('=> Setting up for tests');
require('./setup.js');

var mupDir = process.cwd();
var keyPath = path.resolve(mupDir, 'tests/fixtures/ssh/new.pub');
var user = argv.nonRoot ? 'normal-user' : 'root';
var userPath = user === 'root' ? '/root' : `/home/${user}`;

sh.env.PROD_SERVER_USER = user;
sh.env.PROD_SERVER = '127.0.0.1';
sh.env.PROD_SERVER_PORT = '3500';
sh.env.PROD_SERVER_PEM = path.resolve(mupDir, 'tests/fixtures/ssh/new');
sh.env.MUP_SKIP_UPDATE_CHECK = 'true';

var keyVolume = `-v ${keyPath}:${userPath}/.ssh/authorized_keys2`;
var publish = '-p 127.0.0.1:3500:22';
var image = 'mup-tests-server-docker';
var dockerVolume = '-v mup-test-docker-data:/var/lib/docker';

console.log('=> Cleaning cache');
var cleaningContainerId = sh.exec(
  `docker run ${keyVolume} ${publish} ${dockerVolume} --privileged -d -t ${image} /sbin/my_init`
).output.trim();
sh.exec(`docker exec ${cleaningContainerId} sudo service docker start`);

// Stop all running containers
sh.exec(`docker exec ${cleaningContainerId} bash -c "docker rm -f $(docker ps -a -q)"`);
// Exit the container. We use a new container to discard any
// changes docker made for running containers, such as creating
// missing directories for volumes.
sh.exec(`docker rm -f ${cleaningContainerId}`);

console.log('=> Starting Ubuntu Container');
var containerId = sh.exec(
  `docker run ${keyVolume} ${publish} ${dockerVolume} --privileged -d -t ${image} /sbin/my_init`
).output.trim();

sh.exec(`docker exec ${containerId} sudo service docker start`);
sh.exec(`docker exec ${containerId} cp ${userPath}/.ssh/authorized_keys2 ${userPath}/.ssh/authorized_keys`);

if (user !== 'root') {
  sh.exec(`docker exec ${containerId} chown -R ${user}:${user} ${userPath}/.ssh`);
}

var watch = argv.watch ? '--watch' : '';

var files = argv.path ? argv.path : 'src/**/__tests__/**/*.js';
if (argv.plugins) {
  files = argv.plugins
    .split(',')
    .filter(plugin => plugin.length > 0)
    .map(plugin => `src/plugins/${plugin}/__tests__/**/*.js`)
    .join(' ');
}

var g = argv.g ? ` -g ${argv.g}` : '';
var command = `npm run test:module -- ${watch} ${g} ${files}`;
console.log('=> COMMAND', command);
var testCode = sh.exec(command)
  .code;

sh.exec(`docker rm -f ${containerId}`);
process.exit(testCode);
