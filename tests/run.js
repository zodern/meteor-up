/* eslint-disable no-var */

var sh = require('shelljs');
var path = require('path');
var argv = require('yargs').argv;

require('./setup.js');

var mupDir = process.cwd();
var keyPath = path.resolve(mupDir, 'tests/fixtures/ssh/new.pub');

sh.env.PROD_SERVER_USER = 'root';
sh.env.PROD_SERVER = '127.0.0.1';
sh.env.PROD_SERVER_PORT = '3500';
sh.env.PROD_SERVER_PEM = path.resolve(mupDir, 'tests/fixtures/ssh/new');
sh.env.MUP_SKIP_UPDATE_CHECK = 'false';

var volume = `-v ${keyPath}:/root/.ssh/authorized_keys2`;
var publish = '-p 127.0.0.1:3500:22';
var image = argv.skipPull ? 'mup-tests-server' : 'mup-tests-server-docker';

var containerId = sh.exec(
  `docker run ${volume} ${publish} --privileged -d -t ${image} /sbin/my_init`
).output.trim();

sh.exec(`docker exec ${containerId} sudo service docker start`);
sh.exec(`docker exec ${containerId} cp /root/.ssh/authorized_keys2 /root/.ssh/authorized_keys`);

var watch = argv.watch ? ' --watch' : '';
var files = argv.path ? argv.path : ' src/**/__tests__/**/*.js';
if (argv.plugin) {
  files = ` src/plugins/${argv.plugin}/__tests__/**/*.js`;
}

var g = argv.g ? ` -g ${argv.g}` : '';
var command = `npm run test:module -- ${files}${watch}${g}`;

var testCode = sh.exec(command)
  .code;

sh.exec(`docker rm -f ${containerId}`);
process.exit(testCode);
