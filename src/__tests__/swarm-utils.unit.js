import {
  calculateAdditionalManagers, currentManagers, desiredManagers
} from '../swarm-utils';
import { expect } from 'chai';

function createServerInfo(servers) {
  return servers.reduce((result, options) => {
    result[options.name] = {
      swarm: {
        LocalNodeState: options.state || 'active',
        Cluster: 'cluster' in options ? options.cluster : {}
      }
    };

    return result;
  }, {});
}

describe('swarm-utils', () => {
  describe('currentManagers', () => {
    it('should return active managers', () => {
      const serverInfo = createServerInfo([{
        name: 'one'
      }, {
        name: 'two',
        state: 'inactive'
      }, {
        name: 'three',
        cluster: null
      }]);
      const result = ['one'];

      expect(currentManagers(serverInfo)).to.deep.equal(result);
    });
  });
  describe('calculateAdditionalManagers', () => {
    const fourServersConfig = {
      servers: {
        one: {},
        two: {},
        three: {},
        four: {}
      }
    };

    it('should be at least 1 when no requested managers', () => {
      const config = {
        servers: {
          one: {},
          two: {}
        }
      };

      expect(calculateAdditionalManagers(config)).to.equal(1);
    });
    it('should be at least 3 when there is enough servers', () => {
      expect(calculateAdditionalManagers(fourServersConfig)).to.equal(3);
    });
    it('should subtract requested managers', () => {
      const config = {
        ...fourServersConfig,
        proxy: {
          servers: {
            one: {}
          }
        }
      };

      expect(calculateAdditionalManagers(config)).to.equal(2);
    });
    it('should be odd when enough servers', () => {
      const config = {
        servers: { one: {}, two: {}, three: {}, four: {}, five: {}},
        proxy: {
          servers: { one: {}, two: {}, three: {}, four: {}}
        }
      };

      expect(calculateAdditionalManagers(config)).to.equal(1);
    });
    it('should be even when not enough servers', () => {
      const config = {
        ...fourServersConfig,
        proxy: {
          servers: { one: {}, two: {}, three: {}, four: {}}
        }
      };

      expect(calculateAdditionalManagers(config)).to.equal(0);
    });
  });
  describe('desiredManagers', () => {
    it('should use requested servers', () => {
      const config = {
        servers: {one: {}, two: {}},
        swarm: {},
        proxy: {
          servers: {
            one: {}
          }
        }
      };
      const result = ['one'];

      expect(desiredManagers(config)).to.deep.equal(result);
    });
    it('should have 3 managers if possible', () => {
      const config = {
        servers: {
          one: {},
          two: {},
          three: {}
        }
      };
      const serverInfo = createServerInfo([{
        name: 'one',
        cluster: null
      }, {
        name: 'two',
        cluster: null
      }, {
        name: 'three',
        cluster: null
      }]);
      const result = ['one', 'two', 'three'];

      expect(desiredManagers(config, serverInfo)).to.deep.equal(result);
    });
    it('should use existing managers', () => {
      const config = {
        servers: {
          one: {},
          two: {}
        }
      };
      const serverInfo = createServerInfo([{
        name: 'one',
        cluster: null
      }, {
        name: 'two'
      }]);

      const result = ['two'];

      expect(desiredManagers(config, serverInfo)).to.deep.equal(result);
    });
  });
});
