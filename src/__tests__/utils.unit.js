import * as utils from '../utils';
import assert from 'assert';
import { expect } from 'chai';
import nodemiral from '@zodern/nodemiral';
import path from 'path';

describe('utils', () => {
  describe('addStdioHandlers', () => {
    it('should add stdio handlers to nodemiral task list', () => {
      const list = nodemiral.taskList('Test');
      list.executeScript('testing', {});
      // Test that it doesn't throw an error
      utils.addStdioHandlers(list);
    });
  });

  describe('runTaskList', () => {
    it('should resolve when list is sucessfull', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({});
        }
      };
      utils.runTaskList(list, {}, {}).then(() => {
        cb();
      });
    });

    it('should add stdio handlers for verbose', cb => {
      const list = {
        _taskQueue: [],
        run(sessions, opts, runCb) {
          expect(opts.verbose).to.equal(undefined);
          runCb({});
        }
      };

      utils.runTaskList(list, {}, { verbose: true })
        .then(() => { cb(); });
    });

    it('should reject if a task failed', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({
            copy: {
              error: 'error'
            }
          });
        }
      };

      utils.runTaskList(list, {}, {}).catch(() => {
        cb();
      });
    });
  });

  describe('countOccurences', () => {
    it('should return the correct count', () => {
      const needle = 'Meteor';
      const haystack = 'Production Quality Meteor Deployments. Meteor Up is a command line tool that allows you to deploy any Meteor app to your own server.';
      const count = utils.countOccurences(needle, haystack);
      assert(count === 3);
    });
  });

  describe('resolvePath', () => {
    it('should return the correct path', () => {
      const result = utils.resolvePath('/root', '../opt');
      const expected = path.resolve('/root', '../opt');
      assert(result === expected);
    });
    it('should expand tilde', () => {
      const result = utils.resolvePath('~/.ssh');
      assert(result.indexOf('~') === -1);
    });
  });

  describe('createOption', () => {
    it('should handle long options', () => {
      const result = utils.createOption('option');

      assert(result === '--option');
    });
    it('should handle short options', () => {
      const result = utils.createOption('o');

      assert(result === '-o');
    });
  });

  describe('argvContains', () => {
    it('should find exact matches', () => {
      const result = utils.argvContains(['a', 'b'], 'a');

      assert(result);
    });
    it('should find matches that contain the value', () => {
      const result = utils.argvContains(['a', 'b=c'], 'b');

      assert(result);
    });
    it('should return false if not found', () => {
      const result = utils.argvContains(['a', 'b'], 'c');

      assert(!result);
    });
  });

  describe('filterArgv', () => {
    it('should remove unwanted options', () => {
      const argv = { _: ['logs'], config: './mup.js', tail: true };
      const argvArray = ['mup', 'logs', '--config=./mup.js', '--tail'];
      const unwanted = ['_', 'config'];
      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--tail']);
    });
    it('should remove undefined and false options', () => {
      const argv = { _: ['logs'], config: undefined, verbose: true, follow: false };
      const argvArray = ['mup', 'logs', '--verbose'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--verbose']);
    });
    it('should add non-boolean values', () => {
      const argv = { _: ['logs'], tail: '10', follow: true };
      const argvArray = ['mup', 'logs', '--tail=10', '--follow'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--tail', '10', '--follow']);
    });
    it('should remove options not provided by user', () => {
      const argv = { _: ['logs'], follow: true, tail: '10' };
      const argvArray = ['mup', 'logs'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs']);
    });
  });
});
