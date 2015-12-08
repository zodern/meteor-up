#!/usr/bin/env node
require('babel-core/register');
require('babel-polyfill');

// In multiple occassions, Promise rejects are not
// handled inside code. Print such errors and exit.
process.on('unhandledRejection', function (error) {
  console.error(error && error.stack || error);
  process.exit(1);
});

require('./lib/execute');
