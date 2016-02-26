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
      mymeteor: {},
    },
    env: {
      ROOT_URL: 'http://'+servers.mymeteor.host+'.com',
      MONGO_URL: 'mongodb://'+servers.mymongo.host+'/meteor'
    },
    log: {
      driver: 'syslog'
    }
  },

  hooks: {
    'before-meteor-setup': { command: 'touch beforeMeteorSetup' },
    'after-meteor-setup': { command: 'touch afterMeteorSetup' },

    'before-push': { command: 'touch beforePush' },
    'after-push': { command: 'touch afterPush' },

    'before-startup': { command: 'touch beforeStartup' },
    'after-startup': { command: 'touch afterStartup' },

    'before-envconfig-push': { command: 'touch beforeEnvConfigPush' },
    'after-envconfig-push': { command: 'touch afterEnvConfigPush' },

    'before-meteor-start': { command: 'touch beforeMeteorStart' },
    'after-meteor-start': { command: 'touch afterMeteorStart' },

    'before-meteor-deploy-verification': { command: 'touch beforeMeteorDeployVerification' },
    'after-meteor-deploy-verification': { command: 'touch afterMeteorDeployVerification' },

    'before-meteor-stop': { command: 'touch beforeMeteorStop' },
    'after-meteor-stop': { command: 'touch afterMeteorStop' }
  },

  mongo: {
    oplog: true,
    servers: {
      mymongo: {},
    },
  },

  proxy: {
    servers: {
      myproxy: {},
    },
  },
};
