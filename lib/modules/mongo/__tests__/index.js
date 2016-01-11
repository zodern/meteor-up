import {expect} from 'chai';
import path from 'path';
import sh from 'shelljs';
import {describe, it} from 'mocha';
import {countOccurences, runSSHCommand} from '../../utils';

const servers = require(path.resolve(__rootdir, 'tests/servers'));

describe('module - mongo', function () {
  this.timeout(600000);

  describe('dump', function () {
    it('TODO write tests');
  });

  describe('help', function () {
    it('TODO write tests');
  });

  describe('logs', function () {
    it('should pull logs from "meteor" vm', async done => {
      sh.cd(path.resolve(__rootdir, 'tests/project-1'));

      sh.exec('mup docker setup && mup mongo setup && mup mongo start', {silent: true});
      const out = sh.exec('mup mongo logs', {silent: true});

      expect(out.code).to.be.equal(0);
      expect(countOccurences('MongoDB starting :', out.output)).to.be.equal(1);
      expect(countOccurences('db version', out.output)).to.be.equal(1);
      expect(countOccurences('waiting for connections on port 27017', out.output)).to.be.equal(1);

      done();
    });
  });

  describe('setup', function () {
    it('should setup mongodb on "mongo" vm', async done => {
      const serverInfo = servers['mymongo'];
      sh.cd(path.resolve(__rootdir,'tests/project-1'));

      const out = sh.exec('mup mongo setup', {silent: true});
      expect(out.code).to.be.equal(0);

      expect(countOccurences('setup environment: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('copying mongodb.conf: SUCCESS', out.output)).to.be.equal(1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufi /opt');
      expect(sshOut.code).to.be.equal(0);
      expect(countOccurences('mongodb.conf', sshOut.output)).to.be.equal(1);

      done();
    });
  });

  describe('start', function () {
    it('should start mongodb on "mongo" vm', async done => {
      const serverInfo = servers['mymongo'];

      sh.cd(path.resolve(__rootdir, 'tests/project-1'));
      sh.exec('mup docker setup && mup mongo setup', {silent: true});

      const out = sh.exec('mup mongo start', {silent: true});
      expect(out.code).to.be.equal(0);

      expect(countOccurences('start mongo: SUCCESS', out.output)).to.be.equal(1);

      const sshOut = await runSSHCommand(serverInfo, 'sudo docker ps --format "{{ .Names }}"');
      expect(sshOut.code).to.be.equal(0);
      expect(countOccurences('mongodb', sshOut.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(0);

      done();
    });
  });

  describe('stop', function () {
    it('should stop mongodb on "mongo" vm', async done => {
      const serverInfo = servers['mymongo'];

      sh.cd(path.resolve(__rootdir, 'tests/project-1'));
      sh.exec('mup docker setup && mup mongo setup && mup mongo start', {silent: true});

      const out = sh.exec('mup mongo stop', {silent: true});
      expect(out.code).to.be.equal(0);

      expect(countOccurences('stop mongo: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(1);

      done();
    });
  });
});
