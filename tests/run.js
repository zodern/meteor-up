var sh = require('shelljs');
var path = require('path');

require('./setup.js');

var mupDir = process.cwd();
var keyPath = path.resolve(mupDir, 'tests/fixtures/ssh/new.pub');

sh.env['PROD_SERVER_USER'] = 'root';
sh.env['PROD_SERVER'] = '127.0.0.1';
sh.env['PROD_SERVER_PORT'] = '3500';
sh.env['PROD_SERVER_PEM'] = path.resolve(mupDir, 'tests/fixtures/ssh/new');

const volume = `-v ${keyPath}:/root/.ssh/authorized_keys`;
const publish = '-p 127.0.0.1:3500:22';
const image = 'mup-tests-server-docker';

var containerId = sh.exec(
  `docker run ${volume} ${publish} --privileged -d -t ${image} /sbin/my_init`
).output.trim();

sh.exec(`docker exec ${containerId} sudo service docker start`);

var testCode = sh.exec('npm run test:module -s -- "src/**/__tests__/**/*.js"')
  .code;

sh.exec(`docker rm -f ${containerId}`);
process.exit(testCode);
