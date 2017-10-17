import * as utils from '../utils';
import assert from 'assert';
import { expect } from 'chai';
import nodemiral from 'nodemiral';
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

      utils.runTaskList(list, {}, {verbose: true})
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
});
