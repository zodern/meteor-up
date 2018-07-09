var path = require('path');
var servers = require('../servers');

var meteorPath = path.resolve('..', 'helloapp');

module.exports = {
  servers: servers,

  app: {
    name: 'myapp',
    path: '../helloapp',
    servers: {
      mymeteor: {}
    },

    env: {
      ROOT_URL: 'http://' + servers.mymeteor.host + '.com',
      MONGO_URL: 'mongodb://mongodb:27017/meteor'
    },

    docker: {
      image: 'zodern/meteor'
    },

    deployCheckWaitTime: 300
  },

  proxy: {
    domains: 'website.com',
    shared: {
      clientUploadLimit: '10M'
    }
  },

  mongo: {
    version: '3.4.1',
    servers: {
      mymongo: {}
    }
  }
};
