require('babel-core/register');
require('babel-polyfill');

// add a __rootdir global to avoid '../../../../../'
// like paths when requiring package files.
var path = require('path');
__rootdir = path.resolve(__dirname, '..');

process.on('unhandledRejection', function (error) {
  //console.error('Unhandled Promise Rejection:');
  //console.error(error && error.stack || error);
  throw error;
});
