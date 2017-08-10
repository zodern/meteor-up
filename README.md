# Meteor Up [![Travis branch](https://img.shields.io/travis/zodern/meteor-up/master.svg?style=flat-square)](https://travis-ci.org/zodern/meteor-up/) [![Code Climate](https://img.shields.io/codeclimate/github/zodern/meteor-up.svg?style=flat-square)](https://codeclimate.com/github/zodern/meteor-up) [![Gitter](https://img.shields.io/gitter/room/meteor-up/Lobby.svg?style=flat-square)](https://gitter.im/meteor-up/Lobby)

#### Production Quality Meteor Deployments

Meteor Up is a command line tool that allows you to deploy any [Meteor](http://meteor.com) app to your own server.

You can install and use Meteor Up on Linux, Mac and Windows. It can deploy to servers running Ubuntu 14 or newer.

This version of Meteor Up is powered by [Docker](http://www.docker.com/), making deployment easy to manage and reducing server specific errors.

Read the [getting started tutorial](http://zodern.github.io/meteor-up/getting-started.html).  

### Features

* Single command server setup
* Single command deployment
* Deploy to multiple servers
* Environment Variable management
* Support for [`settings.json`](http://docs.meteor.com/#meteor_settings)
* Password or Private Key (pem) based server authentication
* Access logs from the terminal (supports log tailing)
* Support for custom docker images
* Support for Let's Encrypt and custom SSL certificates

### Server Configuration

* Auto-restart if the app crashes
* Auto-start after server reboot
* Runs with docker for better security and isolation
* Reverts to the previous version if the deployment failed
* Pre-installed PhantomJS

### Installation

Meteor Up requires Node v4 or newer. It runs on Windows, Mac, and Windows.

```bash
npm install -g mup
```

`mup` should be installed on the computer you are deploying from.

### Using Mup
- [Getting Started](http://zodern.github.io/meteor-up/getting-started.html)
- [Docs](http://zodern.github.io/meteor-up/docs.html)

### Support

First, look at the [troubleshooting](http://zodern.github.io/meteor-up/docs.html#troubleshooting) and [common problems](http://zodern.github.io/meteor-up/docs.html#common-problems) sections of the docs. You can also search the [github issues](https://github.com/zodern/meteor-up/issues).

If that doesn't solve the problem, you can:
- [Create a Github issue](https://github.com/zodern/meteor-up/issues/new)
- [Chat on Gitter](https://gitter.im/meteor-up/Lobby)
