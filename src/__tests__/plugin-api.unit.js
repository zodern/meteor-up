import * as validate from '../validate';
import { commands } from '../commands';
import { expect } from 'chai';
import fs from 'fs';
import { hooks } from '../hooks';
import path from 'path';
import PluginAPI from '../plugin-api';
import sinon from 'sinon';

describe('PluginAPI', () => {
  let api;
  const base = path.join(__dirname, '../../tests/fixtures/project-unit-tests');
  const filteredArgs = ['--tail'];
  const program = {
    verbose: true
  };

  beforeEach(() => {
    api = new PluginAPI(base, filteredArgs, program);
  });

  describe('configPath', () => {
    it('should prefer --config option', () => {
      const _api = new PluginAPI(base, filteredArgs, { config: '~/project2/.deploy/mup.js' });

      expect(_api.configPath).to.include('project2');
    });

    it('should fallback to base', () => {
      expect(api.configPath).to.equal(path.join(base, 'mup.js'));
    });
  });

  describe('base', () => {
    it('should prefer config path', () => {
      const _api = new PluginAPI(base, filteredArgs, { config: '~/project2/.deploy/mup.js' });

      expect(_api.base).to.equal('~/project2/.deploy');
    });

    it('should fallback to given base', () => {
      expect(api.base).to.equal(base);
    });
  });

  describe('properties', () => {
    it('should have "program"', () => {
      expect(api).has.property('program');
    });
    it('should have "commandHistory"', () => {
      expect(api).has.property('commandHistory');
    });
  });
  describe('utils', () => {
    it('should have resolvePath', () => {
      expect(api.resolvePath).to.be.a('function');
    });
    it('should have runTaskList', () => {
      expect(api.runTaskList).to.be.a('function');
    });
    it('should have getDockerLogs', () => {
      expect(api.getDockerLogs).to.be.a('function');
    });
    it('should have runSSHCommand', () => {
      expect(api.runSSHCommand).to.be.a('function');
    });
  });
  describe('getArgs', () => {
    it('should return args', () => {
      expect(api.getArgs()).to.equal(filteredArgs);
    });
  });

  describe('getBasePath', () => {
    it('should return base', () => {
      expect(api.getBasePath()).to.equal(base);
    });
  });

  describe('getVerbose', () => {
    it('should return verbose', () => {
      expect(api.getVerbose()).to.equal(true);
    });
  });

  describe('getOptions', () => {
    it('should return options', () => {
      expect(api.getOptions()).to.equal(program);
    });
  });

  describe('hasMeteorPackage', () => {
    let fsStub;
    let configStub;

    beforeEach(() => {
      fsStub = sinon.stub(fs, 'readFileSync').callsFake(() => ({
        toString() {
          return `
            package1@3
            package2@3
            #package3@3
            `;
        }
      }));

      configStub = sinon.stub(api, 'getConfig').callsFake(() => ({
        meteor: {
          path: '../'
        }
      }));
    });

    afterEach(() => {
      fsStub.restore();
      configStub.restore();
    });

    it('should return true if package is used', () => {
      expect(api.hasMeteorPackage('package2')).to.equal(true);
    });

    it('should ignore commented out lines', () => {
      expect(api.hasMeteorPackage('package3')).to.equal(false);
    });

    it('should return false if could not find app', () => {
      fsStub.restore();
      expect(api.hasMeteorPackage('package2')).to.equal(false);
    });
  });

  describe('validateConfig', () => {
    const errors = { errors: ['error1', 'error2'], depreciations: [] };
    let validatorStub;
    let totalConsoleOutput = '';
    let consoleStub;

    beforeEach(() => {
      totalConsoleOutput = '';
      validatorStub = sinon.stub(validate, 'default').returns(errors);
      consoleStub = sinon.stub(console, 'log').callsFake((...text) => {
        totalConsoleOutput += text.join(' ');
      });
    });

    afterEach(() => {
      validatorStub.restore();
      consoleStub.restore();
    });

    it('should show validation errors', () => {
      api.validateConfig(api.configPath);
      consoleStub.restore();

      expect(totalConsoleOutput).to.contain('- error1');
      expect(totalConsoleOutput).to.contain('- error2');
    });

    it('should show nothing when config is valid', () => {
      errors.errors = [];
      errors.depreciations = [];

      api.validateConfig(api.configPath);

      expect(totalConsoleOutput).to.equal('');
    });
  });

  describe('_normalizeConfig', () => {
    it('should copy meteor object to app', () => {
      const expected = { meteor: { path: '../' }, app: { type: 'meteor', path: '../', docker: { image: 'kadirahq/meteord', imagePort: 3000, stopAppDuringPrepareBundle: true } } };
      const config = { meteor: { path: '../' } };
      const result = api._normalizeConfig(config);

      expect(result).to.deep.equal(expected);
    });
  });

  describe('setConfig', () => {
    it('should update the old config', () => {
      const newConfig = { servers: { two: 0 } };

      api.setConfig(newConfig);

      expect(api.getConfig()).to.deep.equal(newConfig);
    });
  });

  describe('runCommand', () => {
    let commandCalled = false;
    let preHookCalled = false;
    let postHookCalled = false;

    beforeEach(() => {
      hooks['pre.test.logs'] = [{
        method() {
          preHookCalled = true;
        }
      }];
      hooks['post.test.logs'] = [{
        method() {
          postHookCalled = true;
        }
      }];

      commands['test.logs'] = {
        handler() {
          commandCalled = true;
        }
      };

      commandCalled = false;
      preHookCalled = false;
      postHookCalled = false;
    });

    after(() => {
      delete hooks['pre.test.logs'];
      delete hooks['post.test.logs'];
      delete commands['test.logs'];
    });

    it('should throw if name is not provided', cb => {
      api.runCommand().catch(() => {
        cb();
      });
    });

    it('should throw if unknown command', cb => {
      api.runCommand('nonexistent.command').catch(() => {
        cb();
      });
    });

    it('should run command', cb => {
      api.runCommand('test.logs').then(() => {
        expect(commandCalled).to.equal(true);
        cb();
      });
    });

    it('should run hooks', cb => {
      api.runCommand('test.logs').then(() => {
        expect(preHookCalled).to.equal(true);
        expect(postHookCalled).to.equal(true);
        cb();
      })
        .catch(e => {
          console.log(e);
        });
    });

    it('should update commandHistory', () => {
      api.runCommand('test.logs');
      expect(api.commandHistory).to.deep.equal([{name: 'test.logs'}]);
    });
  });

  describe('getSessions', () => {
    it('should return sessions for plugins', () => {
      const sessions = api.getSessions(['meteor', 'mongo']);

      expect(sessions).to.have.length(2);
    });
  });

  describe('_loadSessions', () => {
    it('should add sessions to this.sessions', () => {
      api._loadSessions();
      expect(api.sessions).to.have.keys('one', 'two');
    });
  });

  describe('_pickSessions', () => {
    it('should return sessions for each plugin', () => {
      const result = api._pickSessions(['meteor', 'mongo']);

      expect(result).to.have.keys('one', 'two');
    });
  });
});
