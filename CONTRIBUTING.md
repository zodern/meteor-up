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

## Test options
`--watch`

`-g <regex>`

`--path <test files>` Defaults to `src/**/__tests__/**/*.js`

`--plugins mocha,meter` Runs tests for the plugins, separated by commas. Overrides `--path`

`--non-root` Uses a non-root user in the docker container it deploys to

For example:
```
npm test -- --watch
```

## Updating the Docs

The `/docs` directory contains the docs hosted at [meteor-up.com](http://meteor-up.com). To run the docs website locally:

##### 1 - Install NPM dependencies

```
npm install
```

##### 2 - Set-up Jekyll
Follow the [official docs](https://jekyllrb.com/docs/installation/) for instruction on how to set-up Jekyll on your system.


##### 3 - Install Gems
```
cd docs
bundle install
```

##### 4 - Build and serve the website
```
cd ..
npm run docs
```

The webiste will now be running at [http://localhost:8080/](http://localhost:8080/). 

## Financial contributions

We also welcome financial contributions in full transparency on our [open collective](https://opencollective.com/meteor-up).
Anyone can file an expense. If the expense makes sense for the development of the community, it will be "merged" in the ledger of our open collective by the core contributors and the person who filed the expense will be reimbursed.


## Credits


### Contributors

Thank you to all the people who have already contributed to meteor-up!
<a href="graphs/contributors"><img src="https://opencollective.com/meteor-up/contributors.svg?width=890" /></a>


### Backers

Thank you to all our backers! [[Become a backer](https://opencollective.com/meteor-up#backer)]

<a href="https://opencollective.com/meteor-up#backers" target="_blank"><img src="https://opencollective.com/meteor-up/backers.svg?width=890"></a>


### Sponsors

Thank you to all our sponsors! (please ask your company to also support this open source project by [becoming a sponsor](https://opencollective.com/meteor-up#sponsor))

<a href="https://opencollective.com/meteor-up/sponsor/0/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/1/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/2/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/3/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/4/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/5/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/6/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/7/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/8/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/meteor-up/sponsor/9/website" target="_blank"><img src="https://opencollective.com/meteor-up/sponsor/9/avatar.svg"></a>
