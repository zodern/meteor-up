import { countOccurrences, runSSHCommand } from '../../../utils';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import os from 'os';
import path from 'path';
import sh from 'shelljs';
const servers = require('../../../../tests/fixtures/servers');

sh.config.silent = false;

describe('module - mongo', function() {
  this.timeout(600000);

  describe('logs', () => {
    it('should pull logs from "meteor" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('mup setup');
      const out = sh.exec('mup mongo logs');

      expect(out.code).to.be.equal(0);
      expect(countOccurrences('MongoDB starting :', out.stdout)).to.be.equal(1);
      expect(countOccurrences('db version', out.stdout)).to.be.equal(1);
    });
  });

  describe('setup', () => {
    it('should setup mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      const out = sh.exec('mup mongo setup');

      expect(out.code).to.be.equal(0);

      expect(
        countOccurrences('Setup Environment: SUCCESS', out.stdout)
      ).to.be.equal(1);
      expect(
        countOccurrences('Copying Mongo Config: SUCCESS', out.stdout)
      ).to.be.equal(1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufi /opt');

      expect(sshOut.code).to.be.equal(0);
      expect(countOccurrences('mongo-start-new.sh', sshOut.output)).to.be.equal(1);
    });
  });

  describe('start', () => {
    it('should start mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup docker setup && mup mongo setup');

      const out = sh.exec('mup mongo start');
      expect(out.code).to.be.equal(0);

      expect(countOccurrences('Start Mongo: SUCCESS', out.stdout)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(0);
    });

    it('should allow configuring db name', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      const out = sh.exec('mup --config mup.db-name.js validate --show');

      expect(out.code).to.be.equal(0);

      expect(countOccurrences('mongodb://mongodb:27017/test-db', out.stdout)).to.be.equal(
        1
      );
    });
  });

  describe('stop', () => {
    it('should stop mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup docker setup && mup mongo setup && mup mongo start');

      const out = sh.exec('mup mongo stop');

      expect(out.code).to.be.equal(0);

      expect(countOccurrences('Stop Mongo: SUCCESS', out.stdout)).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(1);
    });
  });
});
