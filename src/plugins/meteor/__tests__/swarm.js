import chai, { expect } from 'chai';
import { describe, it } from 'mocha';
import chaiString from 'chai-string';
import os from 'os';
import path from 'path';
import { runSSHCommand } from '../../../utils';
import sh from 'shelljs';

chai.use(chaiString);
sh.config.silent = false;
const servers = require('../../../../tests/fixtures/servers');

function cdSwarmProject() {
  sh.cd(path.resolve(os.tmpdir(), 'tests/project-swarm'));
}

async function checkRunning() {
  const serverInfo = servers.mymeteor;

  const sshService = await runSSHCommand(
    serverInfo,
    'sudo docker service inspect myapp-service'
  );

  expect(sshService.code).to.equal(0);

  // TODO: for the app to run without repeatedly crashing
  // we need to run a mongo instance that can be connected to
  // from the swarm service
  // const sshOut = await runSSHCommand(
  //   serverInfo,
  //   'curl localhost:80'
  // );

  // expect(sshOut.code).to.equal(0);
}

describe('module - meteor swarm', function() {
  this.timeout(600000);

  this.afterAll(() => {
    cdSwarmProject();
    sh.exec('mup docker destroy-cluster');
  });

  describe('envconfig', () => {
    it('should not run when swarm is enabled', async () => {
      cdSwarmProject();
      sh.exec('mup setup && mup meteor push --cached-build');
      const out = sh.exec('mup meteor envconfig');

      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('Sending Environment Variables', 0);
    });
  });

  describe('start', () => {
    it('should create service', async () => {
      cdSwarmProject();
      sh.exec(
        'mup setup && mup meteor push --cached-build'
      );

      const out = sh.exec('mup meteor start');

      expect(out.code).to.equal(0);
      await checkRunning();
    });
  });
  describe('stop', () => {
    it('should remove service', async () => {
      const serverInfo = servers.mymeteor;

      cdSwarmProject();
      sh.exec(
        'mup setup && mup meteor deploy --cached-build'
      );

      const out = sh.exec(
        'mup meteor stop'
      );

      expect(out.output).to.have.entriesCount('Stop myapp-service: SUCCESS', 1);

      const sshService = await runSSHCommand(
        serverInfo,
        'sudo docker service inspect myapp-service'
      );

      expect(sshService.code).to.equal(1);
    });
  });
  describe('restart', () => {
    it('should restart the service', async () => {
      cdSwarmProject();
      sh.exec(
        'mup setup && mup meteor deploy --cached-build'
      );

      const out = sh.exec(
        'mup meteor restart'
      );

      expect(out.output).to.have.entriesCount('Restart myapp-service: SUCCESS', 1);
      await checkRunning();
    });
  });
  describe('logs', () => {
    it('should show service logs', async () => {
      cdSwarmProject();
      sh.exec(
        'mup setup && mup meteor deploy --cached-build'
      );
      const out = sh.exec(
        'mup meteor logs --tail 2'
      );

      expect(out.output.indexOf('=> Starting meteor app on port 3000')).to.be.greaterThan(-1);
    });
  });
});
