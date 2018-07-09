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
      mymeteor: {
        env: {
          TEST: true
        }
      }
    },
    env: {
      ROOT_URL: 'http://' + servers.mymeteor.host + '.com',
      MONGO_URL: 'mongodb://mongodb:27017/meteor'
    },
    log: {
      driver: 'syslog'
    },
    docker: {
      image: 'zodern/meteor'
    },
    deployCheckWaitTime: 300
  },
  mongo: {
    servers: {
      mymongo: {}
    }
  }
};
