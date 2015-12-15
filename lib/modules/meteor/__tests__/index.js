import {describe, it} from 'mocha';
import assert from 'assert';
import path from 'path';
import sh from 'shelljs';
import {countOccurences, runSSHCommand} from '../../utils';

const servers = require(path.resolve(__rootdir, 'tests/servers'));

describe('module - meteor', function () {
  it('TODO write tests');

  describe('help', function () {
    it('TODO write tests');
  });

  describe('logs', function () {
    this.timeout(60000);
    it('shoul pull the logs from "meteor" vm', async () => {

      sh.cd(path.resolve('/tmp','tests/project1'));

      const out = sh.exec('mup meteor logs');
      assert.equal(out.code, 0);
    });
  });

  describe('setup', function () {
    this.timeout(60000);
    it('should setup enviranment on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];

      await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
      await runSSHCommand(serverInfo, 'sudo apt-get -qq install -y tree');

      const out = sh.exec('mup meteor setup');
      assert.equal(out.code, 0);

      const num = countOccurences('setup environment: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufid /opt');
      assert.equal(countOccurences('/opt/myapp', sshOut.output), 3);
      assert.equal(countOccurences('/opt/myapp/config', sshOut.output), 1);
      assert.equal(countOccurences('/opt/myapp/tmp', sshOut.output), 1);

      //done();
    });
  });

  describe('push', function () {
    function checkBundle() {
      const serverInfo = servers['mymeteor'];

      return async function(done) {
        this.timeout(60000);
        sh.cd(path.resolve('/tmp','tests/project-1'));

        const out = sh.exec('mup meteor push', {silent: true});
        assert.equal(out.code, 0);

        const num = countOccurences('Pushing Meteor app bundle to the server: SUCCESS', out.output);
        assert.equal(num, 1);

        const sshOut = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/tmp/bundle.tar.gz');
        assert.equal(sshOut.code, 0);

        const sshOut2 = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/config/start.sh');
        assert.equal(sshOut2.code, 0);

        done();
      };
    }
    it('should push meteor app bundle to "meteor" vm', checkBundle());
  });

  describe('envconfig',function () {
    const serverInfo = servers['mymeteor'];
    this.timeout(60000);
    it('should push send the enviranment variables to "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup meteor envconfig', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Sending environment variables: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'ls -al /opt/myapp/config/env.list');
      assert.equal(sshOut.code, 0);
    });
  });


  describe('start', function () {
    const serverInfo = servers['mymeteor'];
    var checkServer = async function (done) {
      this.timeout(60000);
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor push && mup meteor envconfig');
      const out = sh.exec('mup meteor start', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('start meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 0);

      done();
    };
    it('should start meteor on "meteor" vm', checkServer);
  });

  describe('deploy', function () {
    this.timeout(60000);
    const serverInfo = servers['mymeteor'];
    it('should deploy meteor app on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup meteor deploy', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('Sending environment variables: SUCCESS', out.output);
      assert.equal(num, 1);

      const num2 = countOccurences('start meteor: SUCCESS', out.output);
      assert.equal(num2, 1);

      const num3 = countOccurences('Pushing Meteor app bundle to the server: SUCCESS', out.output);
      assert.equal(num3, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 0);
    });
  });

  describe('stop', function () {
    this.timeout(60000);
    const serverInfo = servers['mymeteor'];
    it('should stop meteor app on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup meteor stop', {silent: true});
      assert.equal(out.code, 0);

      const num = countOccurences('stop meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0');
      assert.equal(sshOut.code, 7);
    });
  });
});
