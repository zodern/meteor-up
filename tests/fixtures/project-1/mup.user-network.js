var config = require('./mup.js');

config.app.docker.networks = [
  'mup-tests'
]

module.exports = config;
