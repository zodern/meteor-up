## Implementing Features and Bug Fixes

Meteor Up 1.0 is still in development. We need help porting old mup and mupx features to this version. Bug Fixes and feature implementations can be submitted as pull request on the master branch on this repo. Make sure your modifications does not break any of the current tests.

## Running Tests
Our test suit is written using [mocha](https://mochajs.org/) + [sheljs](https://github.com/shelljs/shelljs) and parallelized using [GNU parallel](http://www.gnu.org/software/parallel/) + docker. Parallel testing currently only tested on Ubuntu (14.04).

### Running Tests Parallelly
Parallel testing works by creating docker instances per each test case given and actually deploying a meteor app inside that using meteor up. So the box running tests should have a higher CPU/RAM depending on your MOCHA_PARALLEL setting.

Before running the tests, make sure the server's user account running the tests is in the sudoers list. Test suit depends on node, docker, meteor and gnu parallel. If any of them are not available, test suit will automatically install them.

#### How to run tests

* Get a Ubuntu (14.04) box (Our setup is 4vCPU/10GB ram VM for 6 parallel tests)
* Clone your meteor up fork into `~/meteor-up`
* Decide your parallelism setting (default is 4)
```
export MOCHA_PARALLEL=<number of cores * 1.5>
```
* Start testing
```
bash <meteor-up dir>/tests/test-run.sh
```

### Running Tests Serially

If you don't have access to a high end box, You can run tests serially on the development box or low end remote box. This will not use docker. Instead, it will deploy meteor app on the given server using meteor up. Either use `ssh-agent` or modify `<meteor-up dir>/tests/project-1/mup.js` file to setup authentication to test box.
```
export PROD_SERVER=<server ip> #localhost for local testing
export PROD_SERVER_USER=<server user>
npm test

#or for individual/selective tests
npm test -- -g "<regex>"
#ex npm test -- -g "meteor.deploy"
```

### A note about docker

Since we are using docker inside docker for parallel testing, `Aufs` storage driver for docker(the default) should be disabled. Our test script automatically does this by setting `DOCKER_OPTS="--storage-driver=devicemapper"` in `/etc/default/docker`. In case you installed docker yourself. You should set this manually.

If you are running a docker instance as the PROD_SERVER above, It should be run with `--privileged=true` flag to be able to run a docker daemon inside.


## Adding Tests
Write tests for modules in `<meteor-up dir>/lib/modules/<module name>/__tests__/index.js`.
To run the test in parallel, add a matching regex to the `<meteor-up dir>/tests/tests.list` in a new line.

