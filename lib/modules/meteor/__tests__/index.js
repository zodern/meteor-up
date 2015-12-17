import {describe, it} from 'mocha';
import assert from 'assert';
import path from 'path';
import sh from 'shelljs';
import {countOccurences, runSSHCommand} from '../../utils';

const servers = require(path.resolve(__rootdir, 'tests/servers'));

describe('module - meteor', function () {
  it('TODO write tests');

  this.timeout(600000);

  async function cleanup(server) {
    if (process.env.CIRCLECI) {
      await runSSHCommand(server, 'sudo rm -rf /opt/myapp || :');
      return;
    }
    await runSSHCommand(server, 'sudo apt-get -y purge docker-engine && sudo apt-get -y autoremove --purge docker-engine && sudo rm -rf /var/lib/docker && sudo rm -rf /opt/myapp || :');
  }

  describe('help', function () {
    it('TODO write tests');
  });

  describe('setup', function () {

    it('should setup enviranment on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];

      await cleanup(serverInfo);
      await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
      await runSSHCommand(serverInfo, 'sudo apt-get -qq install -y tree');

      const out = sh.exec('mup meteor setup', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Setup Environment: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufid /opt');
      assert.equal(countOccurences('/opt/myapp', sshOut.output), 3);
      assert.equal(countOccurences('/opt/myapp/config', sshOut.output), 1);
      assert.equal(countOccurences('/opt/myapp/tmp', sshOut.output), 1);

      done();
    });
  });

  describe('push', function () {
    it('should push meteor app bundle to "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];

      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp','tests/project-1'));

      sh.exec('mup meteor setup', {silent: true});

      const out = sh.exec('mup meteor push', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Pushing Meteor App Bundle to The Server: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/tmp/bundle.tar.gz');
      assert.equal(sshOut.code, 0);

      const sshOut2 = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/config/start.sh');
      assert.equal(sshOut2.code, 0);

      done();
    });
  });

  describe('envconfig',function () {
    const serverInfo = servers['mymeteor'];
    it('should send the enviranment variables to "meteor" vm', async done => {
      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup', {silent: true});

      const out = sh.exec('mup meteor envconfig', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Sending Environment Variables: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/config/env.list');
      assert.equal(sshOut.code, 0);

      done();
    });
  });


  describe('start', function () {
    const serverInfo = servers['mymeteor'];

    it('should start meteor on "meteor" vm', async done => {

      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup && mup meteor push && mup meteor envconfig', {silent: true});
      const out = sh.exec('mup meteor start', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Start Meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 0);

      done();
    });
  });

  describe('deploy', function () {
    const serverInfo = servers['mymeteor'];
    it('should deploy meteor app on "meteor" vm', async done => {

      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup', {silent: true});
      const out = sh.exec('mup meteor deploy', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Sending Environment Variables: SUCCESS', out.output);
      assert.equal(num, 1);

      const num2 = countOccurences('Start Meteor: SUCCESS', out.output);
      assert.equal(num2, 1);

      const num3 = countOccurences('Pushing Meteor App Bundle to The Server: SUCCESS', out.output);
      assert.equal(num3, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 0);

      done();
    });
  });

  describe('logs', function () {
    it('should pull the logs from "meteor" vm', async () => {

      sh.cd(path.resolve('/tmp','tests/project-1'));

      const out = sh.exec('mup meteor logs', {silent: true});
      assert.equal(out.code, 0);
    });
  });

  describe('stop', function () {
    const serverInfo = servers['mymeteor'];
    it('should stop meteor app on "meteor" vm', async done => {

      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup && mup meteor deploy', {silent: true});
      const out = sh.exec('mup meteor stop', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Stop Meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 7);

      done();
    });
  });
});
