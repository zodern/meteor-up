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
    it('TODO write tests');
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

        done();
      };
    }
    it('should push meteor app bundle to "meteor" vm', checkBundle());
  });

  describe('start', function () {
    it('TODO write tests');
  });

  describe('stop', function () {
    it('TODO write tests');
  });
});
