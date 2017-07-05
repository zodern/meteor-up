import assert from 'assert';
import validate, { _pluginValidators, addPluginValidator } from '../index';

describe('validator', function() {
  beforeEach(() => {
    for (const prop of Object.keys(_pluginValidators)) {
      delete _pluginValidators[prop];
    }
  });

  describe('addPluginValidator', function() {
    it('should add validator', function() {
      const handler = () => {};
      addPluginValidator('metrics', handler);
      assert(_pluginValidators['metrics'] === handler);
    });
  });

  describe('validate', function() {
    it('should validate the config', function() {
      const config = {
        servers: {
          one: {
            host: '0.0.0.0'
          }
        }
      };
      const errors = validate(config);
      console.log(errors);
      assert(errors instanceof Array);
    });
  });
});
