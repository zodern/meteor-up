import registerCommand, { commands, registerCommandOverrides } from '../commands';
import assert from 'assert';
import sinon from 'sinon';

describe('commands', () => {
  beforeEach(() => {
    for (const prop of Object.keys(commands)) {
      delete commands[prop];
    }
  });

  describe('registerCommad', () => {
    it('should add command to list of commands', () => {
      function handler() {}
      registerCommand('docker', 'setup', handler);
      assert(commands['docker.setup'] === handler);
    });
  });

  describe('registerCommandOverrides', () => {
    let spy;
    beforeEach(() => {
      spy = sinon.spy(console, 'log');
    });
    afterEach(() => {
      spy.restore();
    });

    it('should add override to list of commands', () => {
      function target() {}
      commands['plugin.docker-setup'] = target;
      registerCommandOverrides('plugin', {
        'docker.setup': 'plugin.docker-setup'
      });
      assert(commands['docker.setup'] === target);
    });
    it('should support shorter override format', () => {
      function target() {}
      commands['plugin.docker-setup'] = target;

      registerCommandOverrides('plugin', {
        'docker.setup': 'docker-setup'
      });
      assert(commands['docker.setup'] === target);
    });
    it('should warn when override handler doesn\'t exist', () => {
      registerCommandOverrides('plugin', {
        'docker.setup': 'docker-setup'
      });
      assert(spy.called);
    });
  });
});
