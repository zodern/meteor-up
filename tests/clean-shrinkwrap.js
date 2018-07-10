/* eslint-disable no-var */
// NPM 5 now adds optional dependencies, which older versions of npm
// try to install even if it is the wrong architecture.

var fs = require('fs');
var toRemove = ['fsevents', 'nan'];
var shrinkwrap = JSON.parse(fs.readFileSync('../npm-shrinkwrap.json'));

function cleanRequires(requires) {
  toRemove.forEach(dep => {
    if (dep in requires) {
      console.log('removing requires', dep);
      delete requires[dep];
    }
  });
}

function cleanDependencies(dependencies) {
  Object.keys(dependencies).forEach(dep => {
    if (toRemove.indexOf(dep) > -1) {
      console.log('removing dep', dep);
      delete dependencies[dep];
    } else {
      if (dependencies[dep].dependencies) {
        cleanDependencies(dependencies[dep].dependencies);
      }
      if (dependencies[dep].requires) {
        cleanRequires(dependencies[dep].requires);
      }
    }
  });
}

cleanDependencies(shrinkwrap.dependencies);

fs.writeFileSync('../npm-shrinkwrap.json', `${JSON.stringify(shrinkwrap, null, 2)}\n`);
