// This file doesn't use es6 since it needs to work on old versions of Node

if (typeof Buffer.alloc === 'undefined') {
  console.log('Meteor Up requries a version of node that has "Buffer.alloc". Please update node.');
  process.exit(1);
}

// eslint-disable-next-line no-var
var version = parseInt(process.versions.node.split('.')[0], 10);

if (version < 8) {
  // eslint-disable-next-line
  console.log('Meteor Up requires node 8 or newer. You are using ' + process.version);
  process.exit(1);
}
