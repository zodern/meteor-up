var config = require('./mup.js');

config.app.docker.args = [
  '--network mup-tests'
]

module.exports = config;
