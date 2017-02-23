import { countOccurences, runSSHCommand } from '../../utils';
import { describe, it } from 'mocha';

/* eslint-disable max-len, no-unused-expressions */
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import sh from 'shelljs';

sh.config.silent = false;
const servers = require('../../../../tests/servers');

describe('module - default', function() {
  this.timeout(600000);

  describe('deploy', function() {
    it('should deploy meteor app on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup');

      const out = sh.exec('mup deploy');

      expect(out.code).to.be.equal(0);
      expect(
        countOccurences('Building App Bundle Locally', out.output)
      ).to.be.equal(1);
      expect(
        countOccurences(
          'Pushing Meteor App Bundle to The Server: SUCCESS',
          out.output
        )
      ).to.be.equal(1);
      expect(
        countOccurences('Pushing the Startup Script: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        countOccurences('Sending Environment Variables: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      const ssh1 = await runSSHCommand(
        serverInfo,
        'nc -z -v -w5 localhost 27017'
      );
      expect(ssh1.code).to.be.equal(0);
      const ssh2 = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      expect(ssh2.code).to.be.equal(0);
    });
  });

  describe('help', function() {
    it('TODO write tests');
  });

  describe('init', function() {
    it('should create "mup.js" and "setting.json" in /tmp/project-tmp', () => {
      const dir = '/tmp/project-tmp';
      sh.mkdir(dir);
      sh.cd(dir);
      sh.exec('mup init');
      expect(fs.existsSync(path.resolve(dir, 'mup.js'))).to.true;
      expect(fs.existsSync(path.resolve(dir, 'settings.json'))).to.true;
      sh.rm('-rf', dir);
    });
  });

  describe('logs', function() {
    it('should pull the logs from meteor app', () => {
      sh.cd(path.resolve('/tmp/', 'tests/project-1'));
      const out = sh.exec('mup logs');
      expect(out.code).to.be.equal(0);
    });
  });

  describe('reconfig', function() {
    it('should reconfig meteor app on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup reconfig');

      expect(out.code).to.be.equal(0);
      expect(
        countOccurences('Sending Environment Variables: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0);
    });
  });

  describe('restart', function() {
    it('should restart meteor app on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup restart');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Stop Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0);
    });
  });

  describe('setup', function() {
    it('should setup "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup setup');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('setup docker: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('setup environment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(countOccurences('start mongo: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(0);
    });
  });

  describe('start', function() {
    it('should start meteor app on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup meteor push && mup meteor envconfig');

      const out = sh.exec('mup start');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0);
    });
  });

  describe('stop', function() {
    it('should stop meteor app on "meteor" vm', async () => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup stop');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Stop Meteor: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(7);
    });
  });

  describe('syslog', function() {
    const serverInfo = servers['mymeteor'];

    it('should write meteor logst to syslog on "meteor" vm', async () => {
      sh.cd(path.resolve('/tmp', 'tests/project-2'));

      sh.exec('mup setup && mup deploy');
      const out = await runSSHCommand(
        serverInfo,
        'sudo tail -n 100 /var/log/syslog'
      );
      expect(out.code).to.be.equal(0);

      expect(
        countOccurences('=> Starting meteor app on port:80', out.output)
      ).gte(1);
    });
  });
});
