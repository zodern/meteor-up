import { expect } from 'chai';
import validate, { _pluginValidators, addPluginValidator } from '../index';

describe('validator', function() {
  beforeEach(() => {
    for (const prop of Object.keys(_pluginValidators)) {
      delete _pluginValidators[prop];
    }
  });

  describe('addPluginValidator', function() {
    it('should add validator', function() {
      const handler = () => { };
      addPluginValidator('metrics', handler);
      expect(_pluginValidators['metrics']).to.equal(handler);
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

      let errors;

      try {
        errors = validate(config);
      } catch (e) {
        console.log(e);
      }
      // console.log(errors);
      expect(errors).instanceOf(Array);
    });
  });
});
