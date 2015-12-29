import {describe, it} from 'mocha';
import assert from 'assert';
import path from 'path';
import sh from 'shelljs';
import {countOccurences, runSSHCommand} from '../../utils';

// require server ssh auth information from tests directory
const servers = require(path.resolve(__rootdir, 'tests/servers'));


describe('module - docker', function () {
  it('TODO write tests');

  describe('help', function () {
    it('TODO write tests');
  });

  describe('setup', function () {
    // reuse this function for 3 tests below
    // TODO break this into multiple functions
    // so parts can be used for other tests
    function checkDocker(name) {
      // TODO get server name form mup.js file
      const serverInfo = servers['my' + name];

      return async function (done) {
        this.timeout(60000);

        sh.cd(path.resolve(__rootdir, 'tests/project-1'));

        const out = sh.exec('mup docker setup', {silent: false});
        assert.equal(out.code, 0);

        const num = countOccurences('setup docker: SUCCESS', out.output);
        assert.equal(num, 3);

        const sshOut = await runSSHCommand(serverInfo, 'which docker');
        assert.equal(sshOut.code, 0);

        done();
      };
    }

    it('should install docker on "meteor" vm', checkDocker('meteor'));
    it('should install docker on "mongo" vm', checkDocker('mongo'));
    it('should install docker on "proxy" vm', checkDocker('proxy'));
  });
});
