import { countOccurences, resolvePath, runSSHCommand } from '../../../utils';
import { describe, it } from 'mocha';
import assert from 'assert';
import os from 'os';
import sh from 'shelljs';

sh.config.silent = false;
const servers = require('../../../../tests/fixtures/servers');

describe('module - docker', function() {
  this.timeout(6000000);

  describe('setup', () => {
    // reuse this function for 3 tests below
    // TODO break this into multiple functions
    // so parts can be used for other tests
    function checkDocker(name) {
      // TODO get server name form mup.js file
      const serverInfo = servers[`my${name}`];

      return async function() {
        this.timeout(60000);

        sh.cd(resolvePath(os.tmpdir(), 'tests/project-1'));
        const out = sh.exec('mup docker setup');
        assert.equal(out.code, 0);

        const num = countOccurences('Setup Docker: SUCCESS', out.output);
        assert.equal(num, 1);

        const sshOut = await runSSHCommand(serverInfo, 'which docker');
        assert.equal(sshOut.code, 0);
      };
    }

    it('should install docker on "meteor" vm', checkDocker('meteor'));
    it('should install docker on "mongo" vm', checkDocker('mongo'));
    it('should install docker on "proxy" vm', checkDocker('proxy'));
  });
});
