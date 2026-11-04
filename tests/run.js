import path from 'path';
import sh from 'shelljs';
import yargs from 'yargs';

const argv = yargs.argv;

const mupDir = process.cwd();
const keyPath = path.resolve(mupDir, 'tests/fixtures/ssh/new.pub');
const pemPath = path.resolve(mupDir, 'tests/fixtures/ssh/new');
const user = argv.nonRoot ? 'normal-user' : 'root';
const userPath = user === 'root' ? '/root' : `/home/${user}`;
const host = '127.0.0.1';
const port = '3500';

sh.env.PROD_SERVER_USER = user;
sh.env.PROD_SERVER = host;
sh.env.PROD_SERVER_PORT = port;
sh.env.PROD_SERVER_PEM = pemPath;
sh.env.MUP_SKIP_UPDATE_CHECK = 'true';
sh.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const keyVolume = `-v ${keyPath}:${userPath}/.ssh/authorized_keys2`;
const publish = '-p 127.0.0.1:3500:22';
const image = 'mup-tests-server-docker';
const dockerVolume = '-v mup-test-docker-data:/var/lib/docker';
let containerId;

console.log('=> Setting up for tests');
await import('./setup.js');

console.log('=> Cleaning cache');
const cleaningContainerId = sh.exec(
  `docker run ${keyVolume} ${publish} ${dockerVolume} --privileged -d -t ${image} /sbin/my_init`
).stdout.trim();
sh.exec(`docker exec ${cleaningContainerId} sudo service docker start`);

// Stop all running containers
const containers = sh.exec(`docker exec ${cleaningContainerId} bash -c "docker ps -a -q"`).stdout.trim();
if (containers.length > 0) {
  sh.exec(`docker exec ${cleaningContainerId} bash -c "docker rm -f ${containers.split('\n').join(' ')}"`);
}

// Exit the container. We use a new container to discard any
// changes docker made for running containers, such as creating
// missing directories for volumes.
sh.exec(`docker rm -f ${cleaningContainerId}`);

console.log('=> Starting Ubuntu Container');
containerId = sh.exec(
  `docker run ${keyVolume} ${publish} ${dockerVolume} --privileged -d -t ${image} /sbin/my_init`
).stdout.trim();

sh.exec(`docker exec ${containerId} sudo service docker start`);
sh.exec(`docker exec ${containerId} cp ${userPath}/.ssh/authorized_keys2 ${userPath}/.ssh/authorized_keys`);

if (user !== 'root') {
  sh.exec(`docker exec ${containerId} chown -R ${user}:${user} ${userPath}/.ssh`);
}


const watch = argv.watch ? '--watch' : '';

let files = argv.path ? argv.path : 'src/**/__tests__/**/*.cjs';
if (argv.plugins) {
  files = argv.plugins
    .split(',')
    .filter(plugin => plugin.length > 0)
    .map(plugin => `src/plugins/${plugin}/__tests__/**/*.cjs`)
    .join(' ');
}

const g = argv.g ? ` -g ${argv.g}` : '';
const command = `npm run test:module -- ${watch} ${g} ${files}`;
console.log('=> COMMAND', command);
const testCode = sh.exec(command)
  .code;

// If the tests failed, leave the container running to
// help with finding the cause
if (testCode === 0) {
  sh.exec(`docker rm -f ${containerId}`);
}

process.exit(testCode);
