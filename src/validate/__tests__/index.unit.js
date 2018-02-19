import validate, { _pluginValidators, addPluginValidator } from '../index';
import { expect } from 'chai';

describe('validator', () => {
  beforeEach(() => {
    for (const prop of Object.keys(_pluginValidators)) {
      delete _pluginValidators[prop];
    }
  });

  describe('addPluginValidator', () => {
    it('should add validator', () => {
      const handler = () => { };

      addPluginValidator('metrics', handler);
      expect(_pluginValidators.metrics).to.equal(handler);
    });
  });

  describe('validate', () => {
    it('should validate the config', () => {
      const config = {
        servers: {
          one: {
            host: '0.0.0.0'
          }
        }
      };

      let problems;

      try {
        problems = validate(config);
      } catch (e) {
        console.log(e);
      }
      // console.log(errors);
      expect(problems.errors).instanceOf(Array);
      expect(problems.depreciations).instanceOf(Array);
    });
  });
});
