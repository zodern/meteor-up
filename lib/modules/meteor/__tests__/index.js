/* eslint-disable max-len */
import assert from 'assert';
import path from 'path';
import sh from 'shelljs';
import {describe, it} from 'mocha';
import {countOccurences, runSSHCommand} from '../../utils';

sh.config.silent = false;
const servers = require(path.resolve(__rootdir, 'tests/servers'));

describe('module - meteor', function () {
  this.timeout(600000);

  async function cleanup(server) {
    await runSSHCommand(server, 'sudo apt-get -y purge docker-engine && sudo apt-get -y autoremove --purge docker-engine && sudo rm -rf /var/lib/docker && sudo rm -rf /opt/myapp && sudo rm -rf ~/before* && sudo rm -rf ~/after || :');
  }

  describe('help', function () {
    it('TODO write tests');
  });

  describe('setup', function () {
    it('should setup environment on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];

      await cleanup(serverInfo);
      await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
      await runSSHCommand(serverInfo, 'sudo apt-get -qq update && sudo apt-get -qq install -y tree');

      sh.cd(path.resolve('/tmp/', 'tests/project-1'));

      const out = sh.exec('mup meteor setup');
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

      sh.exec('mup meteor setup');

      const out = sh.exec('mup meteor push');
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

      sh.exec('mup meteor setup');

      const out = sh.exec('mup meteor envconfig');
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

      sh.exec('mup docker setup && mup meteor setup && mup meteor push && mup meteor envconfig');
      const out = sh.exec('mup meteor start');
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

      sh.exec('mup docker setup && mup meteor setup');
      const out = sh.exec('mup meteor deploy');
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

      const out = sh.exec('mup meteor logs');
      assert.equal(out.code, 0);
    });
  });

  describe('stop', function () {
    const serverInfo = servers['mymeteor'];
    it('should stop meteor app on "meteor" vm', async done => {

      await cleanup(serverInfo);

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup docker setup && mup meteor setup && mup meteor deploy');
      const out = sh.exec('mup meteor stop');
      assert.equal(out.code, 0);

      const num = countOccurences('Stop Meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 7);

      done();
    });

    describe('setup hooks', function() {
      it('should call meteor setup hooks', async done => {
        const serverInfo = servers['mymeteor'];

        await cleanup(serverInfo);
        await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
        await runSSHCommand(serverInfo, 'rm -rf ~/*');  // For the hooks. They are executed, relative to this directory.
        await runSSHCommand(serverInfo, 'sudo apt-get -qq update && sudo apt-get -qq install -y tree');

        sh.cd(path.resolve('/tmp/', 'tests/project-3'));

        const out = sh.exec('mup meteor setup');
        assert.equal(out.code, 0);

        assert.equal(countOccurences('Running before-meteor-setup hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-meteor-setup hook: SUCCESS', out.output), 1);

        // Verify the commands are actually executed in "remote".
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeMeteorSetup')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterMeteorSetup')).code, 0);

        done();
      });
    });

    describe('push hooks', function () {
      it('should call mup push hooks', async done => {
        const serverInfo = servers['mymeteor'];

        await cleanup(serverInfo);

        sh.cd(path.resolve('/tmp', 'tests/project-3'));

        sh.exec('mup meteor setup');

        const out = sh.exec('mup meteor push');
        assert.equal(out.code, 0);

        assert.equal(countOccurences('Running before-push hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-push hook: SUCCESS', out.output), 1);

        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforePush')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterPush')).code, 0);

        done();
      });
    });

    describe('envconfig hooks', function () {
      it('should call mup envconfig push hooks', async done => {
        const serverInfo = servers['mymeteor'];
        await cleanup(serverInfo);

        sh.cd(path.resolve('/tmp', 'tests/project-3'));

        sh.exec('mup meteor setup');

        const out = sh.exec('mup meteor envconfig');
        assert.equal(out.code, 0);

        assert.equal(countOccurences('Running before-envconfig-push hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-envconfig-push hook: SUCCESS', out.output), 1);

        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeEnvConfigPush')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterEnvConfigPush')).code, 0);

        done();
      });
    });

    describe('start hooks', function () {
      it('should execute mup start hooks', async done => {
        const serverInfo = servers['mymeteor'];
        await cleanup(serverInfo);

        sh.cd(path.resolve('/tmp', 'tests/project-3'));

        sh.exec('mup docker setup && mup meteor setup && mup meteor push && mup meteor envconfig');
        const out = sh.exec('mup meteor start');
        assert.equal(out.code, 0);

        assert.equal(countOccurences('Running before-meteor-start hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-meteor-start hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running before-meteor-deploy-verification hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-meteor-deploy-verification hook: SUCCESS', out.output), 1);

        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeMeteorStart')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterMeteorStart')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeMeteorDeployVerification')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterMeteorDeployVerification')).code, 0);

        done();
      });
    });

    describe('deploy hooks', function () {
      it('should deploy meteor app on "meteor" vm', async done => {
        const serverInfo = servers['mymeteor'];
        await cleanup(serverInfo);

        sh.cd(path.resolve('/tmp', 'tests/project-3'));

        sh.exec('mup docker setup && mup meteor setup');
        const out = sh.exec('mup meteor deploy');
        assert.equal(out.code, 0);

        // Hooks messages.
        assert.equal(countOccurences('Running before-push hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-push hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running before-startup startup: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-startup hook: SUCCESS', out.output), 1);

        // Verify the commands are actually executed in "remote".
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforePush')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterPush')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeStartup')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterStartup')).code, 0);

        done();
      });
    });

    describe('stop hooks', function () {
      it('should call mup stop hooks', async done => {
        const serverInfo = servers['mymeteor'];
        await cleanup(serverInfo);

        sh.cd(path.resolve('/tmp', 'tests/project-3'));

        sh.exec('mup docker setup && mup meteor setup && mup meteor deploy');
        const out = sh.exec('mup meteor stop');
        assert.equal(out.code, 0);

        // Hooks messages.
        assert.equal(countOccurences('Running before-stop hook: SUCCESS', out.output), 1);
        assert.equal(countOccurences('Running after-stop hook: SUCCESS', out.output), 1);

        // Verify the commands are actually executed in "remote".
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/beforeStop')).code, 0);
        assert.equal((await runSSHCommand(serverInfo, 'ls -al ~/afterStop')).code, 0);

        done();
      });
    });
  });
});
