var config = require('./mup.js');

config.meteor = config.app;
delete config.app;

config.meteor.path = '../helloapp-old';
delete config.meteor.docker.image;

module.exports = config;
