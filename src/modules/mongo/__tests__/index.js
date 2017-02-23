import { countOccurences, runSSHCommand } from '../../utils';
import { describe, it } from 'mocha';

/* eslint-disable max-len */
import { expect } from 'chai';
import sh from 'shelljs';

sh.config.silent = false;
const servers = require('../../../../tests/servers');

describe('module - mongo', function() {
  this.timeout(600000);

  describe('dump', function() {
    it('TODO write tests');
  });

  describe('help', function() {
    it('TODO write tests');
  });

  describe('logs', function() {
    it('should pull logs from "meteor" vm', async () => {
      sh.cd('/tmp/tests/project-1');

      sh.exec('mup setup');
      const out = sh.exec('mup mongo logs');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('MongoDB starting :', out.output)).to.be.equal(1);
      expect(countOccurences('db version', out.output)).to.be.equal(1);
      expect(
        countOccurences('waiting for connections on port 27017', out.output)
      ).to.be.equal(1);
    });
  });

  describe('setup', function() {
    it('should setup mongodb on "mongo" vm', async () => {
      const serverInfo = servers['mymongo'];
      sh.cd('/tmp/tests/project-1');

      const out = sh.exec('mup mongo setup');
      expect(out.code).to.be.equal(0);

      expect(
        countOccurences('setup environment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        countOccurences('copying mongodb.conf: SUCCESS', out.output)
      ).to.be.equal(1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufi /opt');
      expect(sshOut.code).to.be.equal(0);
      expect(countOccurences('mongodb.conf', sshOut.output)).to.be.equal(1);
    });
  });

  describe('start', function() {
    it('should start mongodb on "mongo" vm', async () => {
      const serverInfo = servers['mymongo'];

      sh.cd('/tmp/tests/project-1');
      sh.exec('mup docker setup && mup mongo setup');

      const out = sh.exec('mup mongo start');
      expect(out.code).to.be.equal(0);

      expect(countOccurences('start mongo: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(0);
    });
  });

  describe('stop', function() {
    it('should stop mongodb on "mongo" vm', async () => {
      const serverInfo = servers['mymongo'];

      sh.cd('/tmp/tests/project-1');
      sh.exec('mup docker setup && mup mongo setup && mup mongo start');

      const out = sh.exec('mup mongo stop');
      expect(out.code).to.be.equal(0);

      expect(countOccurences('stop mongo: SUCCESS', out.output)).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(1);
    });
  });
});
