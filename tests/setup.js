/* eslint-disable no-var */

var sh = require('shelljs');
var os = require('os');
var path = require('path');
var fs = require('fs');
var keypair = require('keypair');
var forge = require('node-forge');

if (process.platform !== 'win32') {
  var installCommands = [
    'command -v node >/dev/null 2>&1 || { curl -sL https://deb.nodesource.com/setup_5.x |  bash - &&  apt-get install -qq -y nodejs; }',
    'command -v docker >/dev/null 2>&1 || { curl https://get.docker.com/ |  sh && echo \'DOCKER_OPTS="--storage-driver=devicemapper"\' |  tee --append /etc/default/docker >/dev/null &&  service docker start ||  service docker restart; }',
    'command -v meteor >/dev/null 2>&1 || { curl https://install.meteor.com/ | sh; }'
  ];
  installCommands.forEach(command => {
    sh.exec(command);
  });
}

var mupDir = process.cwd();
var tmp = path.resolve(os.tmpdir(), 'tests');
var helloapp = path.resolve(mupDir, 'tests/fixtures/helloapp');

if (!fs.existsSync(path.resolve(helloapp, 'node_modules'))) {
  sh.cd(path.resolve(mupDir, 'tests/fixtures/helloapp'));
  sh.exec('npm install');
}


sh.rm('-fr', tmp);
sh.mkdir(tmp);
sh.cp('-rf', path.resolve(mupDir, 'tests/fixtures/*'), tmp);
var containers = sh.exec('docker ps -a -q --filter=ancestor=mup-tests-server');

if (containers.output.length > 0) {
  console.log('server containers');
  sh.exec(`docker rm -f ${containers.output.trim().split('\n').join(' ')}`);
}

containers = sh.exec(
  'docker ps -a -q --filter=ancestor=mup-tests-server-docker'
);
if (containers.output.length > 0) {
  console.log('docker containers');
  sh.exec(`docker rm -f ${containers.output.trim()}`);
}

sh.cd(path.resolve(mupDir, 'tests/fixtures'));

var images = sh.exec('docker images -aq mup-tests-server');
if (images.output.length === 0) {
  sh.exec('docker build -t mup-tests-server .');
}

images = sh.exec('docker images -aq mup-tests-server-docker');
if (images.output.length === 0) {
  console.log('building image');
  sh.exec('docker build -f ./Dockerfile_docker -t mup-tests-server-docker .');
}

var location = path.resolve(mupDir, 'tests/fixtures/ssh/new');
if (!fs.existsSync(location)) {
  sh.cd(path.resolve(mupDir, 'tests/fixtures'));

  sh.rm('-rf', 'ssh');
  sh.mkdir('ssh');
  sh.cd('ssh');
  var pair = keypair();
  var publicKey = forge.pki.publicKeyFromPem(pair.public);

  fs.writeFileSync(location, pair.private);
  fs.writeFileSync(
    `${location}.pub`,
    forge.ssh.publicKeyToOpenSSH(publicKey, 'tests@test.com')
  );

  sh.chmod(600, 'new.pub');
  if (process.platform !== 'win32') {
    sh.exec('sudo chown root:root new.pub');
  }
}

sh.cd(mupDir);
sh.exec('npm link');
