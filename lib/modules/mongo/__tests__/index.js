import assert from 'assert';
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

      sh.exec('mup mongo setup && mup mongo start', {silent: true});
      const out = sh.exec('mup mongo logs', {silent: true});
      assert.equal(out.code, 0, 'mup mongo logs failed');

      done();
    });
  });

  describe('setup', function () {
    it('should setup mongodb on "mongo" vm', async done => {
      const serverInfo = servers['mymongo'];
      sh.cd(path.resolve(__rootdir,'tests/project-1'));

      const out = sh.exec('mup mongo setup', {silent: true});
      assert.equal(out.code, 0);

      assert.equal(countOccurences('setup environment: SUCCESS', out.output), 1);
      assert.equal(countOccurences('copying mongodb.conf: SUCCESS', out.output), 1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufi /opt');
      assert.equal(sshOut.code, 0, 'mongodb.conf not found');
      assert.equal(countOccurences('mongodb.conf', sshOut.output), 1, 'mongodb.conf not found');

      done();
    });
  });

  describe('start', function () {
    it('should start mongodb on "mongo" vm', async done => {
      const serverInfo = servers['mymongo'];

      sh.cd(path.resolve(__rootdir, 'tests/project-1'));
      sh.exec('mup mongo setup', {silent: true});

      const out = sh.exec('mup mongo start', {silent: true});
      assert.equal(out.code, 0, 'mongo start failed');

      assert.equal(countOccurences('start mongo: SUCCESS', out.output), 1, 'mongo start failed');

      const sshOut = await runSSHCommand(serverInfo, 'sudo docker ps --format "{{ .Names }}"');
      assert.equal(sshOut.code, 0, 'docker ps failed');
      assert.equal(countOccurences('mongodb', sshOut.output), 1, 'mongodb container not found');

      done();
    });
  });

  describe('stop', function () {
    it('should stop mongodb on "mongo" vm', async done => {

      sh.cd(path.resolve(__rootdir, 'tests/project-1'));
      sh.exec('mup mongo setup && mup mongo start', {silent: true});

      const out = sh.exec('mup mongo stop', {silent: true});
      assert.equal(out.code, 0, 'mup mongo stop failed');

      assert.equal(countOccurences('stop mongo: SUCCESS', out.output), 1, 'mongo stop failed');

      done();
    });
  });
});
