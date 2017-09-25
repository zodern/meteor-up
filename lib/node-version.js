'use strict';

var version = parseInt(process.versions.node.split('.')[0], 10);

if (version < 4) {
  console.log('Meteor Up requires node v4 or newer. You are using ' + process.version);
  process.exit(1);
}
//# sourceMappingURL=node-version.js.map