var config = require('./mup.js');

config.meteor.path = '../helloapp-old';
delete config.meteor.docker.image;

module.exports = config;
