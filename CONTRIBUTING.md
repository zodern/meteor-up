## Pull request Guidelines

We are excited that you are interested in contributing to Meteor Up. Bug Fixes and feature implementations can be submitted as pull request on the master branch. Make sure your modifications does not break any of the current tests.

## Running Tests
Our test suit is written using [mocha](https://mochajs.org/) + [shelljs](https://github.com/shelljs/shelljs) and parallelled using [GNU parallel](http://www.gnu.org/software/parallel/) + docker. Parallel testing is currently supported for Ubuntu 14.04 and 16.10, as well as Bash on Ubuntu on Windows.

Before running the tests, make sure the server's user account running the tests is in the sudoers list. The test suit depends on node, docker, meteor and gnu parallel. If any of them are not available, the test suit will automatically install them.

If your internet and computer are fast enough, you can run the tests locally. Otherwise, you will want to run the tests on a server.

### Running Tests Parallelly
Parallel testing works by creating docker instances per each test case given and actually deploying a meteor app inside that using meteor up. So the box running tests should have a higher CPU/RAM depending on your `MOCHA_PARALLEL` env setting.

Start parallel tests with:
```
npm run test:parallel
```

#### How to run tests on a server

* Get a Ubuntu (14.04) box (Our setup is 4vCPU/10GB ram VM for 6 parallel tests)
* Clone your meteor up fork into `~/meteor-up`
* Decide your parallelism setting (default is 2)
```
export MOCHA_PARALLEL=<number of cores * 1.5>
```
* Start testing
```
npm install
npm run test:parallel
```

## Running Tests Serially
If the server or your local computer can not handle parallel tests, you can run tests serially. It will create one docker container that all of the tests will use.
```
npm test
```

### Running Tests Serially Without Docker

Another option is to run the tests serially, and deploy to a remote server instead of a docker image. This will not use docker. Instead, it will deploy meteor app on the given server using meteor up. Either use `ssh-agent` or modify `<meteor-up dir>/tests/project-1/mup.js` file to setup authentication to the test box.
```
export PROD_SERVER=<server ip> #localhost for local testing
export PROD_SERVER_USER=<server user>
npm test:custom-server

# or for individual/selective tests
npm test -- -g "<regex>"
# ex npm test -- -g "meteor.deploy"
```

### A note about docker

Since we are using docker inside docker for parallel testing, `Aufs` storage driver for docker(the default) should be disabled. Our test script automatically does this by setting `DOCKER_OPTS="--storage-driver=devicemapper"` in `/etc/default/docker`. In case you installed docker yourself. You should set this manually.

If you are running a docker instance as the PROD_SERVER above, It should be run with `--privileged=true` flag to be able to run a docker daemon inside.


## Adding Tests
Write tests for modules in `<meteor-up dir>/lib/modules/<module name>/__tests__/index.js`.
To run the test in parallel, add a matching regex to the `<meteor-up dir>/tests/tests.list` on a new line.

