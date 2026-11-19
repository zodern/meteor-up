var config = require('./mup.js');

config.meteor = config.app;
delete config.app;

config.meteor.path = '../helloapp-old';
delete config.meteor.docker.image;

config.meteor.env = Object.assign({}, config.meteor.env, {
  npm_config_strict_ssl: 'false'
});

module.exports = config;
