# meteor-up [![Travis branch](https://img.shields.io/travis/zodern/meteor-up/master.svg?style=flat-square)](https://travis-ci.org/zodern/meteor-up/) [![Code Climate](https://img.shields.io/codeclimate/github/zodern/meteor-up.svg?style=flat-square)](https://codeclimate.com/github/zodern/meteor-up) [![Waffle.io](https://img.shields.io/waffle/label/zodern/meteor-up/ready.svg?style=flat-square)](https://waffle.io/zodern/meteor-up)

#### Production Quality Meteor Deployments

Meteor Up is a command line tool that allows you to deploy any [Meteor](http://meteor.com) app to your own server. It currently supports Ubuntu.

This repository formerly was at `kadirahq/meteor-up`.

You can install and use Meteor Up on Linux, Mac and Windows.

This version of Meteor Up is powered by [Docker](http://www.docker.com/), making deployment easy to manage and reducing a lot of server specific errors.

Read the [getting started tutorial](http://zodern.github.io/meteor-up/getting-started.html).  

**Table of Contents**

- [Features](#features)
- [Server Configuration](#server-configuration)
- [Installation](#installation)
- [Creating a Meteor Up Project](#creating-a-meteor-up-project)
- [Example Config](#example-config)
- [Setting Up a Server](#setting-up-a-server)
- [Deploying an App](#deploying-an-app)
- [Build Options](#build-options)
- [Additional Setup/Deploy Information](#additional-setupdeploy-information)
    - [Server Setup Details](#server-setup-details)
    - [Deploy Wait Time](#deploy-wait-time)
    - [Multiple Deployment Targets](#multiple-deployment-targets)
- [Multiple Deployments](#multiple-deployments)
- [SSL Support](#ssl-support)
- [Nginx Upload Size](#nginx-upload)
- [Reverse Proxy (experimental)](#reverse-proxy)
  - [SSL](#ssl)
- [MongoDB](#mongodb)
    - [Accessing the Database](#accessing-the-database)
    - [Change MongoDB Version](#change-mongodb-version)
- [Updating](#updating-mup)
- [Troubleshooting](#troubleshooting)
- [Migrating from Meteor Up 0.x](#migrating-from-meteor-up-0x)

### Features

* Single command server setup
* Single command deployment
* Multi server deployment
* Environment Variable management
* Support for [`settings.json`](http://docs.meteor.com/#meteor_settings)
* Password or Private Key (pem) based server authentication
* Access logs from the terminal (supports log tailing)
* Support for custom docker images
* Support for auto-generating SSL certificates using Let's Encrypt

### Server Configuration

* Auto-restart if the app crashes
* Auto-start after server reboot
* Runs with docker for better security and isolation
* Reverts to the previous version if the deployment failed
* Pre-installed PhantomJS

### Installation

    npm install -g mup

`mup` should be installed on the computer you are deploying from.

### Creating a Meteor Up Project
    cd my-app-folder
    mkdir .deploy
    cd .deploy
    mup init

***WARNING: Windows users need to use `mup.cmd` instead. As `mup` will result in unexpected behavior.***

This will create two files in your Meteor Up project directory:

  * `mup.js` - Meteor Up configuration file
  * `settings.json` - Settings for Meteor's [settings API](http://docs.meteor.com/#meteor_settings)

### Example Config
<!-- eslint comma-dangle: 0 -->

```js
module.exports = {
  servers: {
    one: {
      host: '1.2.3.4',
      username: 'root',
      // pem: '/home/user/.ssh/id_rsa',
      // password: 'password',
      // or leave blank to authenticate using ssh-agent
      opts: {
        port: 22,
      },
    }
  },

  meteor: {
    name: 'app',
    path: '../app',
    // lets you add docker volumes (optional)
    volumes: {
      // passed as '-v /host/path:/container/path' to the docker run command
      '/host/path': '/container/path',
      '/second/host/path': '/second/container/path'
    },
    docker: {
      // Change the image to 'kadirahq/meteord' if you
      // are using Meteor 1.3 or older
      image: 'abernix/meteord:base' , // (optional)
      imagePort: 80, // (optional, default: 80)

      // lets you add/overwrite any parameter on
      // the docker run command (optional)
      args: [
        '--link=myCustomMongoDB:myCustomMongoDB', // linking example
        '--memory-reservation 200M' // memory reservation example
      ],
      // (optional) Only used if using your own ssl certificates.
      // Default is "meteorhacks/mup-frontend-server"
      imageFrontendServer: 'meteorhacks/mup-frontend-server',
      // lets you bind the docker container to a
      // specific network interface (optional)
      bind: '127.0.0.1',
      // lets you add network connections to perform after run
      // (runs docker network connect <net name> for each network listed here)
      networks: [
        'net1'
      ]
    },

     // list of servers to deploy, from the 'servers' list
    servers: {
      one: {}, two: {}, three: {}
    },

    buildOptions: {
      // skip building mobile apps, but still build the web.cordova architecture
      serverOnly: true,
      debug: true,
      cleanAfterBuild: true, // default
      buildLocation: '/my/build/folder', // defaults to /tmp/<uuid>

      // set serverOnly: false if want to build mobile apps when deploying

      // Remove this property for mobileSettings to use your settings.json
      // (optional)
      mobileSettings: {
        yourMobileSetting: 'setting value'
      },
      server: 'http://app.com', // your app url for mobile app access (optional)
       // adds --allow-incompatible-updates arg to build command (optional)
      allowIncompatibleUpdates: true,
    },
    env: {
      // PORT: 8000, // useful when deploying multiple instances (optional)
      ROOT_URL: 'http://app.com', // If you are using ssl, this needs to start with https
      MONGO_URL: 'mongodb://localhost/meteor'
    },
    log: { // (optional)
      driver: 'syslog',
      opts: {
        'syslog-address': 'udp://syslogserverurl.com:1234'
      }
    },
    ssl: {
      // Enables let's encrypt (optional)
      autogenerate: {
        email: 'email.address@domain.com',
        domains: 'website.com,www.website.com' // comma seperated list of domains
      }
    },
    deployCheckWaitTime: 60, // default 10
    // lets you define which port to check after the deploy process, if it
    // differs from the meteor port you are serving
    // (like meteor behind a proxy/firewall) (optional)
    deployCheckPort: 80,

    // Shows progress bar while uploading bundle to server (optional)
    // You might need to disable it on CI servers
    enableUploadProgressBar: true // default false.
  },

  mongo: { // (optional)
    port: 27017,
    version: '3.4.1', // (optional), default is 3.4.1
    servers: {
      one: {},
    }
  }
};
```


### Setting Up a Server

    mup setup

Running this locally will set up the remote server(s) you have specified in mup.js. It will take around 2-5 minutes depending on the server's performance and network availability.

It is safe to run `mup setup` multiple times if needed. After making changes to custom ssl certificates, mongodb, or servers in your config, you need to run `mup setup` for the changes to take effect.

### Deploying an App

    mup deploy

This will bundle the Meteor project locally and deploy it to the remote server(s). The bundling process is exactly how `meteor deploy` does it.

    mup deploy --cached-build

The `--cached-build` option will use the build from the last time you deployed the app. This is useful when the previous deploy failed from a network error or from a problem in the config.

### Other Utility Commands

* `mup reconfig` - reconfigures app with new environment variables, Meteor settings, and it updates the start script
* `mup stop` - stop the app
* `mup start` - start the app
* `mup restart` - restart the app
* `mup logs [-f --tail=50]` - get logs

### Build Options

You can define Meteor build options in `mup.js` like this:

```ts
...
meteor: {
  buildOptions: {
    // build with the debug mode on
    debug: true,
    // mobile setting for cordova apps
    mobileSettings: {
      public: {
        'meteor-up': 'rocks',
      }
    },
    // executable used to build the meteor project
    // you can set a local repo path if needed
    executable: 'meteor',
  }
}
...
```

### Additional Setup/Deploy Information

#### Deploy Wait Time

Meteor Up checks if the deployment is successful or not just after the deployment. It will wait 15 seconds after starting the docker container before starting the checks.  The check runs every second until it either can sucessfully load the app's client, or it runs out of time as defined in `meteor.deployCheckWaitTime`. 

The app's client should have the http status code 200 or redirect on the server to a page that does. If your app does neither, adding the package `zodern:mup-helpers` should allow the deploy check to work.

Most docker images used with mup run `npm install` before starting the app. Especially for small servers, this can take awhile. If deployments fail with `Verifying Deployment: FAILED`, and it looks like npm didn't finish installing dependencies, try increasing the value in `meteor.deployCheckWaitTime`

##### Deploy check port

If you are deploying under a proxy/firewall and need a different port to be checked after deploy, add a variable called `deployCheckPort` with the value of the port you are publishing your application to.

```ts
meteor: {
 ...
  deployCheckPort: 80
 ...
}
```

#### SSH keys with passphrase (or ssh-agent support)

> This only tested with Mac/Linux

It's common to use passphrase enabled SSH keys to add an extra layer of protection to your SSH keys. You can use those keys with `mup` too. In order to do that, you need to use `ssh-agent`.

Here's the process:

* Remove the `pem` field from `mup.js` so your `mup.js` has `username` and `host` only.
* Start ssh agent with `eval $(ssh-agent)`
* Add your ssh key with `ssh-add <path-to-key>`
* You'll be asked to enter the passphrase to the key
* After that, simply invoke `mup` commands and they'll just work
* Once you've deployed your app, kill ssh agent with `ssh-agent -k`

#### SSH based authentication with `sudo`

**If your username is `root` or you're using AWS EC2, you don't need to follow these steps**

Please ensure your key file (pem) is not protected by a passphrase. This setup process will require NOPASSWD access to sudo. (Since Meteor needs port 80, sudo access is required.)

Make sure you also add your ssh key to the `/YOUR_USERNAME/.ssh/authorized_keys` list.

You can add your user to the sudo group:

    sudo adduser *username*  sudo

And you also need to add NOPASSWD to the sudoers file:

    sudo visudo

    # replace this line
    %sudo  ALL=(ALL) ALL

    # by this line
    %sudo ALL=(ALL) NOPASSWD:ALL

When this process is not working you might encounter the following error:

    'sudo: no tty present and no askpass program specified'

#### Server Setup Details

Meteor Up uses Docker to run and manage your app. It uses [MeteorD](https://github.com/meteorhacks/meteord) behind the scenes. Here's how we manage and utilize the server.

* Your currently running meteor bundle lives at `/opt/<appName>/current`
* We have a demonized docker container running the above bundle
* The docker container is started with `--restart=always` flag and it'll re-spawn the container if it dies
* Logs are maintained via Docker
* If you decided to use MongoDB, it will be running as its own Docker container. It's bound to the local interface and to port `27017` (you cannot access it from the outside)
* The database is named `<appName>`

#### Multiple Deployment Targets

You can use an array to deploy to multiple servers at once.

To deploy to *different* environments (e.g. staging, production, etc.), use separate Meteor Up configurations in separate directories, with each directory containing separate `mup.js` and `settings.json` files, and the `mup.js` files' `app` field pointing back to your app's local directory.

### Multiple Deployments

Meteor Up supports multiple deployments to a single server. To route requests to the correct app, use the [reverse proxy](#reverse-proxy)

Let's assume we need to deploy production and staging versions of the app to the same server. The production is at myapp.com, and staging is at staging.myapp.com.

We need to have two separate Meteor Up projects. For that, create two directories and initialize Meteor Up and add the necessary configurations.

In the staging `mup.js`, add a field called `appName` with the value `staging`. You can add any name you prefer instead of `staging`.

Next, add the proxy object to both configs. For your production app, it would be:

```ts
{
  ...
  proxy: {
    domains: 'staging.myapp.com'
  }
}
```

For the staging app, `proxy.domains` would be `staging.myapp.com`.

Now set up both projects and deploy as you need.

### Listening to specific IP address (IP Binding)

If you want Docker to listen only on a specific network interface, such as `127.0.0.1`, add a variable called `bind` with the value of the IP address you want to listen to.

```ts
meteor: {
 ...
 docker: {
  ...
  bind: '127.0.0.1'
  ...
 }
}
```

### Docker networks

If you need to connect your docker container to one or more networks add a variable called `networks` inside the docker configuration. This is an array containing all network names to which it has to connect.

```ts
meteor: {
 ...
  docker: {
    ...
    networks: [
      'myNetwork1'
    ]
    ...
  }
 ...
}
```

### Reverse Proxy

Meteor Up can create a nginx reverse proxy that will handle ssl, and, if you are running multiple apps on the server, it will route requests to the correct app. The proxy is shared between all apps on the servers.

This currently is an experimental feature. This means that the configuration might have breaking changes between releases until it is finalized. This will eventually replace the former nginx setup, configured using `meteor.ssl` and `meteor.nginx`.

Remove `meteor.ssl` and `meteor.nginx` from your config and add a `proxy` section:

```ts
{
  ...
  proxy: { 
    ssl: {
      letsEncryptEmail: 'address@gmail.com'
    },
    // comma seperated list of domains your website
    // will be accessed at.
    // You will need to configure your dns for each one.
    domains: 'website.com,www.website.com'
}
```

You need to stop each app deployed to the servers:
```bash
mup stop
```

Then, run
```bash
mup setup
mup reconfig
```

#### SSL
Add an `ssl` object to your `proxy` config:
```ts
{
  ...
  proxy: {
    ...
    ssl: {
      // For using let's encrypt
      letsEncryptEmail: 'email@domain.com'

      // Use custom certificates
      crt: './bundle.crt',
      key: './private.pem'
    }
  }
}
```
If you are using custom certificates instead, it would look like:
```ts
proxy: {
  ssl: {
    crt: './bundle.crt',
    key: './private.pem'
  }
}
```

#### Advance configuration

```ts
{
  proxy: {
    // Settings in "proxy.shared" will be applied to every app deployed on the servers.
    // Everything is optional. These won't need to be changed for most apps.
    //
    // This only needs to be set in one app that is on the server. 
    // If multiple apps have `proxy.shared`, they will override each other when `mup setup` is run for an app.
    shared: {
      // The port number to listen to for http connections. Default 80.
      httpPort: 80, 
      // The port to listen for htts connections. Default is 443.
      httpsPort: 443,
      // Set proxy wide upload limit. Setting 0 will disable the limit.
      clientUploadLimit: '10M',
      // Environtment variables for nginx proxy
      env: {
        DEFAULT_HOST: 'foo.bar.com'
      },
      // env for the jrcs/letsencrypt-nginx-proxy-companion container
      envLetsencrypt: {
      // Directory URI for the CA ACME API endpoint (default: https://acme-v01.api.letsencrypt.org/directory).
      // If you set it's value to https://acme-staging.api.letsencrypt.org/directory letsencrypt will use test
      // servers that don't have the 5 certs/week/domain limits.
      ACME_CA_URI:  'https://acme-v01.api.letsencrypt.org/directory',
      // Set it to true to enable debugging of the entrypoint script and generation of LetsEncrypt certificates,
      // which could help you pin point any configuration issues.
      DEBUG: true
    },
  }
}
```


### Changing `appName`

It's pretty okay to change the `appName`. But before you do so, you need to stop the project with older `appName`.

### Custom configuration and settings files

You can keep multiple configuration and settings files in the same directory and pass them to mup using the command parameters `--settings` and `--config`. For example, to use a file `mup-staging.js` and `staging-settings.json`, add the parameters like this:

    mup deploy --config=mup-staging.js --settings=staging-settings.json

### SSL Support
Meteor UP can enable SSL support for your app. It can either autogenerate the certificates, or upload them from your dev computer.

**If you are using the reverse proxy, follow [these instructions](#ssl) instead.**

### Autogenerate certificates

Meteor Up can use Let's Encrypt to generate certificates for you. Add the following to your `mup.js` file:

```ts
meteor: {
  ...
  ssl: {
    autogenerate: {
      email: 'email.address@domain.com',
      domains: 'website.com,www.website.com'
    }
  }
}

```

Then run `mup deploy`. It will automatically create certificates and set up SSL, which can take up to a few minutes. The certificates will be automatically renewed when they expire within 30 days.

### Upload certificates

To upload certificates instead of having the server generate them for you, just add the following configuration to your `mup.js` file.

```ts
meteor: {
  ...
  ssl: {
    crt: './bundle.crt', // this is a bundle of certificates
    key: './private.key', // this is the private key of the certificate
    port: 443 // 443 is the default value and it's the standard HTTPS port
  }
  ...
}
```

Now simply do `mup setup` and then `mup deploy`. Your app is now running with a modern SSL setup.

If your certificate and key are already in the right location on your server and you would like to prevent Mup from overriding  them while still needing an SSL setup, you can add `upload: false` to `mup.js` in the `meteor.ssl` object.

To learn more about SSL setup when using your own certificates, refer to the [`mup-frontend-server`](https://github.com/meteorhacks/mup-frontend-server) project.

### Nginx Upload

If you would like to increase the client upload limits, you can change it by adding:

***This Only Works if you are using the Let's Encrypt Autogenerated SSL's***

**If you are using the reverse proxy, follow [these instructions](#advance-configuration) instead.**

```ts

meteor: {
   ...
   nginx: {
     clientUploadLimit: '<desired amount>' // Default is 10M
   }
   ...
}

```

### MongoDB

#### Accessing the Database

You can't access the MongoDB from outside the server. To access the MongoDB shell you need to log into your server via SSH first and then run the following command:

    docker exec -it mongodb mongo <appName>

> Later on we'll be using a separate MongoDB instance for every app.

#### Change Mongodb Version

If you have not deployed to the server, you can change the mongo version by adding:

```ts

mongo: {
  ...
  version: '<desired version>'
}

```

If you have deployed to the server, it involves a couple more steps.

1) Go to the [MongoDB manual](https://docs.mongodb.com/manual/) > Release Notes > Current version of Mongodb > Upgrade or Downgrade Standalone
2) Follow the directions listed there. You can access the MongoDB console by running `docker exec -it mongodb mongo` on the server.
3) During the steps for install or replace binaries or restarting mongodb, instead change the version in your `mup.js` and run `mup setup`.
4) To verify that it worked, run `docker ps` to check if mongodb keeps restarting. If it is, you can see what the problem is with `docker logs mongodb`


### Updating Mup

To update `mup` to the latest version, just type:

    npm install -g mup

mup usually will let you know when there is an update available. You should try and keep `mup` up to date in order to keep up with the latest Meteor changes.

### Troubleshooting

#### Docker image
Make sure that the docker image you are using supports your app's meteor version.

#### Check Logs
If you suddenly can't deploy your app anymore, first use the `mup logs -f` command to check the logs for error messages.

#### Increase RAM
Many problems are caused by the server running out of ram.

#### Verbose Output
If you need to see the output of `mup` (to see more precisely where it's failing or hanging, for example), run it like so:

    DEBUG=mup* mup <command> --verbose

where `<command>` is one of the `mup` commands such as `setup`, `deploy`, etc.

The environment variable `DEBUB=*` gives more information on what the `mup` cli is doing.

The `--verbose` flag shows output from commands and scripts run on the server.

### Common Problems

#### Verifying Deployment: FAILED

If you do not see `=> Starting meteor app on port` in the logs, it did not have had enough time to finish running `npm install`, or there was an error while installing the dependencies. Try increase `meteor.deployCheckWaitTime` until it has enough time to finish `npm install`.

If you do see it in your logs:
1) Make sure your `ROOT_URL` starts with https or http, depending on if you are using ssl or not.
2) If your app's home page has a http status code other than 200, and does not redirect to a page that does, add the meteor package `zodern:mup-helpers`.

#### Mup silently fails, mup.js file opens instead, or you get a Windows script error

If you are using windows, make sure you run commands with `mup.cmd <command>` instead of `mup <command>`.
If it silently fails for a different reason, please create an issue.

#### Error: spawn meteor ENOENT

This usually happens when meteor is not installed.

#### Unwanted redirects to https

Make sure `force-ssl` is not in `.meteor/versions`. If it is, either your app, or a package it uses has `force-ssl` as a dependency.

### Migrating from Meteor Up 0.x

`mup` is not backward compatible with Meteor Up 0.x. or `mupx`.

* Docker is now the runtime for Meteor Up
* We don't have to use Upstart any more
* You don't need to set up NodeJS version or PhantomJS manually (MeteorD will take care of it)
* We use a mongodb docker container to run the local mongodb data (it uses the old mongodb location)
* It uses Nginx and different SSL configurations
* Now we don't re-build binaries. Instead we build for the `os.linux.x86_64` architecture. (This is the same thing what meteor-deploy does)

#### Migration Guide

> Use a new server if possible as you can. Then migrate DNS accordingly. That's the easiest and safest way.

Let's assume our appName is `meteor`

Remove old docker container with: `docker rm -f meteor`
Remove old mongodb container with: `docker rm -f mongodb`
If present remove nginx container with: `docker rm -f meteor-frontend`

Then do `mup setup` and then `mup deploy`.
