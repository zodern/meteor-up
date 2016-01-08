import {expect} from 'chai';
import path from 'path';
import sh from 'shelljs';
import fs from 'fs';
import {describe, it} from 'mocha';
import {countOccurences, runSSHCommand} from '../../utils';

sh.config.silent = false;
const servers = require(path.resolve(__rootdir, 'tests/servers'));

describe('module - default', function () {
  this.timeout(600000);

  describe('deploy', function () {
    it('should deploy meteor app on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup');

      const out = sh.exec('mup deploy');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Bulding App Bundle Locally', out.output)).to.be.equal(1);
      expect(countOccurences('Pushing Meteor App Bundle to The Server: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Pushing the Startup Script: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(0);
      expect((await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);

      done();
    });
  });

  describe('help', function () {
    it('TODO write tests');
  });

  describe('init', function () {
    it('should create "mup.js" and "setting.json" in ./tests/project-2', done => {
      const dir = path.resolve(__rootdir, 'tests/project-2');
      sh.mkdir(dir);
      sh.cd(dir);
      sh.exec('mup init');
      expect(fs.existsSync(path.resolve(dir, 'mup.js'))).to.true;
      expect(fs.existsSync(path.resolve(dir, 'settings.json'))).to.true;
      sh.rm('-rf', dir);
      done();
    });
  });

  describe('logs', function () {
    it('should pull the logs from meteor app', done => {
      sh.cd(path.resolve('/tmp/', 'tests/project-1'));
      const out = sh.exec('mup logs');
      expect(out.code).to.be.equal(0);
      done();
    });
  });

  describe('reconfig', function () {
    it('should reconfig meteor app on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup reconfig');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);

      done();
    });
  });

  describe('restart', function () {
    it('should restart meteor app on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup restart');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Stop Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);

      done();
    });
  });

  describe('setup', function () {
    it('should setup "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));

      const out = sh.exec('mup setup');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('setup docker: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('setup environment: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('start mongo: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(0);

      done();
    });
  });

  describe('start', function () {
    it('should start meteor app on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy && mup stop');

      const out = sh.exec('mup start');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect(countOccurences('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);

      done();
    });
  });

  describe('stop', function () {
    it('should stop meteor app on "meteor" vm', async done => {
      const serverInfo = servers['mymeteor'];
      sh.cd(path.resolve('/tmp', 'tests/project-1'));
      sh.exec('mup setup && mup deploy');

      const out = sh.exec('mup stop');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Stop Meteor: SUCCESS', out.output)).to.be.equal(1);
      expect((await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(7);

      done();
    });
  });
});
