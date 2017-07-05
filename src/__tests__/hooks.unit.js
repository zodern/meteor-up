import assert from 'assert';
import { registerHook, hooks } from '../hooks';

describe('hooks', function() {
  beforeEach(() => {
    for (const prop of Object.keys(hooks)) {
      delete hooks[prop];
    }
  });

  it('should create new hooks', function() {
    function target() {}

    registerHook('pre.default.setup', target);
    assert(hooks['pre.default.setup'].length === 1);
    assert(hooks['pre.default.setup'][0] === target);
  });

  it('should add hooks when some already exist', function() {
    function target() {}

    registerHook('pre.default.setup', target);
    registerHook('pre.default.setup', target);

    assert(hooks['pre.default.setup'].length === 2);
    assert(hooks['pre.default.setup'][1] === target);
  });

  it('should add missing plugin name for hooks for default commands', function() {
    function target() {}
    registerHook('pre.setup', target);

    assert(hooks['pre.default.setup'][0] === target);
  });
});
