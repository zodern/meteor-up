import * as utils from '../utils';
import nodemiral from 'nodemiral';
import assert from 'assert';
import path from 'path';

describe('utils', function() {
  describe('addStdioHandlers', function() {
    it('should add stdio handlers to nodemiral task list', function() {
      const list = nodemiral.taskList('Test');
      list.executeScript('testing', {});
      // Test that it doesn't throw an error
      utils.addStdioHandlers(list);
    });
  });

  describe('countOccurences', function() {
    it('should return the correct count', function() {
      const needle = 'Meteor';
      const haystack = 'Production Quality Meteor Deployments. Meteor Up is a command line tool that allows you to deploy any Meteor app to your own server.';
      const count = utils.countOccurences(needle, haystack);
      assert(count === 3);
    });
  });

  describe('resolvePath', function() {
    it('should return the correct path', function() {
      const result = utils.resolvePath('/root', '../opt');
      const expected = path.resolve('/root', '../opt');
      assert(result === expected);
    });
    it('should expand tilde', function() {
      const result = utils.resolvePath('~/.ssh');
      assert(result.indexOf('~') === -1);
    });
  });
});
