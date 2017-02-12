import { countOccurences, runSSHCommand } from '../../utils';
import { describe, it } from 'mocha';

/* eslint-disable max-len */
import assert from 'assert';
import path from 'path';
import sh from 'shelljs';

sh.config.silent = false;
const servers = require('../../../../tests/servers');

describe('module - meteor', function() {
  this.timeout(600000);

  // async function cleanup(server) {
  //   await runSSHCommand(
  //     server,
  //     'sudo apt-get -y purge docker-engine && sudo apt-get -y autoremove --purge docker-engine && sudo rm -rf /var/lib/docker && sudo rm -rf /opt/myapp || :'
  //   );
  // }

  describe('help', function() {
    it('TODO write tests');
  });

  describe('setup', function() {
    it('should setup enviranment on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];

      await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
      await runSSHCommand(
        serverInfo,
        'sudo apt-get -qq update && sudo apt-get -qq install -y tree'
      );

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup meteor setup');
      assert.equal(out.code, 0);

      const num = countOccurences('Setup Environment: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufid /opt');
      assert.equal(countOccurences('/opt/myapp', sshOut.output), 3);
      assert.equal(countOccurences('/opt/myapp/config', sshOut.output), 1);
      assert.equal(countOccurences('/opt/myapp/tmp', sshOut.output), 1);
    });
  });

  describe('push', function() {
    it('should push meteor app bundle to "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];

      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup');

      const out = sh.exec('mup meteor push');
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Pushing Meteor App Bundle to The Server: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/tmp/bundle.tar.gz'
      );
      assert.equal(sshOut.code, 0);

      const sshOut2 = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/config/start.sh'
      );
      assert.equal(sshOut2.code, 0);
    });
  });

  describe('envconfig', function() {
    const serverInfo = servers['mymeteor'];
    it('should send the enviranment variables to "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup meteor setup');

      const out = sh.exec('mup meteor envconfig');
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Sending Environment Variables: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/config/env.list'
      );
      assert.equal(sshOut.code, 0);
    });
  });

  describe('start', function() {
    const serverInfo = servers['mymeteor'];

    it('should start meteor on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup setup && mup meteor push && mup meteor envconfig');
      const out = sh.exec('mup meteor start');
      assert.equal(out.code, 0);

      const num = countOccurences('Start Meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 0);
    });
  });

  describe('deploy', function() {
    const serverInfo = servers['mymeteor'];
    it('should deploy meteor app on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup setup');
      const out = sh.exec('mup meteor deploy');
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Sending Environment Variables: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const num2 = countOccurences('Start Meteor: SUCCESS', out.output);
      assert.equal(num2, 1);

      const num3 = countOccurences(
        'Pushing Meteor App Bundle to The Server: SUCCESS',
        out.output
      );
      assert.equal(num3, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 0);
    });
  });

  describe('logs', function() {
    it('should pull the logs from "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup meteor logs');
      assert.equal(out.code, 0);
    });
  });

  describe('stop', function() {
    const serverInfo = servers['mymeteor'];
    it('should stop meteor app on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      sh.exec('mup setup && mup deploy');
      const out = sh.exec('mup meteor stop');
      assert.equal(out.code, 0);

      const num = countOccurences('Stop Meteor: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 7);
    });
  });
});
