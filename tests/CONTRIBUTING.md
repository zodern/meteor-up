## Implementing Features and Bug Fixes
Meteor Up 1.0 is still in development. We need help porting old mup and mupx features to this version. Bug Fixes and feature implementations can be submitted as pull request on the master branch on this repo. Make sure your modifications does not break any of the current unit tests.

## Running Unit Tests
Our test suit is written using [mocha](https://mochajs.org/) + [sheljs](https://github.com/shelljs/shelljs) and parallelized using [GNU parallel](http://www.gnu.org/software/parallel/) + docker. Parallel testing currently only supports on Ubuntu (14.04).

Before running the unit tests, make sure the user account running the unit tests is in the sudoers list. Test suit depends on node, docker, meteor and gnu parallel. If any of them are not available, test suit will automatically install them.

Tests can be run in parallel using
```
export MOCHA_PARALLEL=<number of cores * 1.5> #default is 4 
bash <meteor-up dir>/tests/test-run.sh
```

Test can be run in serial on a single server using
```
export PROD_SERVER=<server ip>
export PROD_SERVER_USER=<server user>
npm test

#or for individual/selective tests
npm test -- -g "<regex>"
#ex npm test -- -g "meteor.deploy"
```
### A note about docker
Since we are using docker in docker for parallel testing, Aufs storage driver for docker(the default) should be disabled. Our test script automatically does this by setting `DOCKER_OPTS="--storage-driver=devicemapper"` in `/etc/default/docker`. In case you installed docker yourself. You should set this manually.

If you are running a docker instance as the PROD_SERVER above, It should be run with `--privileged=true` flag to be able to run a docker daemon inside.


## Adding Unit Tests
Write unit tests for modules in `<meteor-up dir>/lib/modules/<module name>/__tests__/index.js`.
To run the test in parallel, add a matching regex to the `<meteor-up dir>/tests/tests.list` in a new line.

