import assert from 'assert';
import { registerHook, hooks } from '../hooks';

describe('hooks', function() {
  beforeEach(() => {
    for (const prop of Object.keys(hooks)) {
      delete hooks[prop];
    }
  });

  it('should create new hooks', function() {
    const target = { localScript: 'test' };

    registerHook('pre.default.setup', target);
    assert(hooks['pre.default.setup'].length === 1);
    assert(hooks['pre.default.setup'][0] === target);
  });

  it('should add hooks when some already exist', function() {
    const target = { localScript: 'test' };

    registerHook('pre.default.setup', target);
    registerHook('pre.default.setup', target);

    assert(hooks['pre.default.setup'].length === 2);
    assert(hooks['pre.default.setup'][1] === target);
  });

  it('should add missing plugin name to hooks for default commands', function() {
    const target = { localScript: 'test' };
    registerHook('pre.setup', target);

    assert(hooks['pre.default.setup'][0] === target);
  });
  it('should move functions to the method property', function() {
    const target = function() {};

    registerHook('pre.setup', target);
    console.dir(hooks);

    assert(hooks['pre.default.setup'][0].method === target);
  });
});
