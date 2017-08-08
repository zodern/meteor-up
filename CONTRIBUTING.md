## Pull request Guidelines

We are excited that you are interested in contributing to Meteor Up. Bug Fixes and feature implementations can be submitted as pull request on the dev branch. Make sure your modifications does not break any of the current tests.

## Running Tests
Our test suit is written using [mocha](https://mochajs.org/) + [shelljs](https://github.com/shelljs/shelljs) and parallelled using [GNU parallel](http://www.gnu.org/software/parallel/) + docker. Parallel testing is currently supported for Ubuntu 14.04 and 16.10.

## Running tests on linux

Before running the tests, make sure the server's user account running the tests is in the sudoers list. The test suit depends on node, docker, meteor and gnu parallel. Before the tests start, it will try to automatically install missing dependencies.

## Running tests on Mac/Windows

The test suit depends on node, docker, and meteor. Please make sure they are installed before running the tests.

### Running Tests Parallelly
Parallel testing works by creating docker instances per each test case given and actually deploying a meteor app inside that using meteor up. So the box running tests should have a higher CPU/RAM depending on your `MOCHA_PARALLEL` env setting. This is only supported on linux.

Start parallel tests with:
```
npm run test:parallel
```

## Running Tests Serially
If the server or your local computer can not handle parallel tests, or you are running the tests on Windows or OSX, you can run tests serially. It will create one docker container that all of the tests will use.
```
npm test
```

### A note about docker

Since we are using docker inside docker for parallel testing, `Aufs` storage driver for docker(the default) should be disabled. Our test script automatically does this by setting `DOCKER_OPTS="--storage-driver=devicemapper"` in `/etc/default/docker`. In case you installed docker yourself, you should set this manually.

## Adding Tests
Write tests for plugins in `<meteor-up dir>/src/plugins/<plugin name>/__tests__/index.js`.
To run the test in parallel, add a matching regex to the `<meteor-up dir>/tests/tests.list` on a new line.
