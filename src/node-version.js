/* eslint-disable no-var */
// This file doesn't use es6 since it needs to work on old versions of Node

if (typeof Buffer.alloc === 'undefined') {
  console.log('Meteor Up requries a version of node that has "Buffer.alloc". Please update node.');
  process.exit(1);
}

var versionParts = process.versions.node.split('.');
var version = parseInt(versionParts[0], 10);
// eslint-disable-next-line no-var
var minorVersion = parseInt(versionParts[1], 10);

if (version < 8) {
  // eslint-disable-next-line
  console.log('Meteor Up requires node 8 or newer. You are using ' + process.version);
  process.exit(1);
}

if (version === 14 && minorVersion <= 15) {
  // eslint-disable-next-line global-require
  var chalk = require('chalk');

  console.log(chalk.yellow('---------------------------------------------------------------------------'));
  console.warn(chalk.yellow('Node 14.1.0 - 14.15 is not supported. Please use a different Node version.'));
  console.log(chalk.yellow('---------------------------------------------------------------------------'));
}
