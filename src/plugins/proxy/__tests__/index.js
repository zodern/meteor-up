import chai, { expect } from 'chai';
import { describe, it } from 'mocha';
import chaiString from 'chai-string';
import os from 'os';
import path from 'path';
import { runSSHCommand } from '../../../utils';
import sh from 'shelljs';
const servers = require('../../../../tests/fixtures/servers');

chai.use(chaiString);

sh.config.silent = false;

describe('module - proxy', function() {
  this.timeout(60000000);
  const serverInfo = servers.mymeteor;

  before(async () => {
    await runSSHCommand(
      serverInfo,
      'docker rm -f $(docker ps -a -q)'
    );
  });

  describe('setup', () => {
    it('should setup proxy on "meteor" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      let out = sh.exec('mup setup');

      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('Setup proxy', 1);
      expect(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

      out = await runSSHCommand(serverInfo, 'sudo docker ps');

      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('mup-nginx-proxy', 2);
      expect(out.output).to.have.entriesCount('mup-nginx-proxy-letsencrypt', 1);

      out = await runSSHCommand(serverInfo, 'du --max-depth=2 /opt');
      expect(out.output).to.have.entriesCount('/opt/mup-nginx-proxy', 5);
      expect(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/certs', 1);
      expect(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/mounted-certs', 1);
      expect(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/config', 1);
      expect(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/upstream', 1);

      out = await runSSHCommand(serverInfo, 'ls /opt/mup-nginx-proxy/config');
      expect(out.output).to.have.entriesCount('shared-config.sh', 1);
      expect(out.output).to.have.entriesCount('env.list', 1);
      expect(out.output).to.have.entriesCount('env_letsencrypt.list', 1);
    });
  });

  describe('reconfig-shared', () => {
    it('it should update shared settings', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      sh.exec('mup setup');

      let out = sh.exec('mup proxy reconfig-shared');
      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('Configuring Proxy\'s Shared Settings', 1);
      expect(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

      out = await runSSHCommand(serverInfo, 'cat /opt/mup-nginx-proxy/config/shared-config.sh');
      expect(out.output).to.have.entriesCount('CLIENT_UPLOAD_LIMIT=10M', 1);
    });
  });

  describe('logs', () => {
    it('should show nginx logs', () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      sh.exec('mup setup');

      const out = sh.exec('mup proxy logs --tail 2');
      expect(out.output).to.have.entriesCount('Received event start for', 1);
      expect(out.code).to.equal(0);
    });
  });
});
