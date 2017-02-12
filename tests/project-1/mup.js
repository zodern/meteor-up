/* eslint-disable */
var path = require('path');

var meteorPath = path.resolve('..', 'helloapp');
var serverFile = path.resolve('..', 'servers');
var servers = require(serverFile);

module.exports = {
  servers: servers,
  meteor: {
    name: 'myapp',
    path: meteorPath,
    servers: {
      mymeteor: {}
    },
    env: {
      ROOT_URL: 'http://' + servers.mymeteor.host + '.com',
      MONGO_URL: 'mongodb://' + servers.mymongo.host + '/meteor'
    },
    deployCheckWaitTime: 120
  },
  mongo: {
    oplog: true,
    servers: {
      mymongo: {}
    }
  },
  proxy: {
    servers: {
      myproxy: {}
    }
  }
};
