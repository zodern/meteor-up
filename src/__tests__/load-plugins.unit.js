import modules, {loadPlugins, isDirectoryMupModule} from '../load-plugins';
import assert from 'assert';

describe('load-plugins', function() {
  it('should load included plugins', function() {
    assert(Object.keys(modules).length > 4);
    assert(Object.keys(modules).indexOf('default') > -1);
  });
});
