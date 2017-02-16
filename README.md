# meteor-up [![Code Climate](https://img.shields.io/codeclimate/github/zodern/meteor-up.svg?style=flat-square)](https://codeclimate.com/github/zodern/meteor-up) [![Waffle.io](https://img.shields.io/waffle/label/zodern/meteor-up/ready.svg?style=flat-square)](https://waffle.io/zodern/meteor-up)

#### Production Quality Meteor Deployments

Meteor Up is a command line tool that allows you to deploy any [Meteor](http://meteor.com) app to your own server. It currently supports Ubuntu.

This repository formerly was at `kadirahq/meteor-up`.

You can install and use Meteor Up on Linux, Mac and Windows.

This version of Meteor Up is powered by [Docker](http://www.docker.com/), making deployment easy to manage and reducing a lot of server specific errors.


**Table of Contents**

- [Features](#features)
- [Server Configuration](#server-configuration)
- [Installation](#installation)
- [Creating a Meteor Up Project](#creating-a-meteor-up-project)
- [Example File](#example-file)
- [Setting Up a Server](#setting-up-a-server)
- [Deploying an App](#deploying-an-app)
- [Build Options](#build-options)
- [Additional Setup/Deploy Information](#additional-setupdeploy-information)
    - [Server Setup Details](#server-setup-details)
    - [Deploy Wait Time](#deploy-wait-time)
    - [Multiple Deployment Targets](#multiple-deployment-targets)
- [Accessing the Database](#accessing-the-database)
- [Multiple Deployments](#multiple-deployments)
- [SSL Support](#ssl-support)
- [Nginx Upload Size](#nginx-upload)
- [Change MongoDB Version](#change-mongodb-version)
- [Updating](#updating-mup)
- [Troubleshooting](#troubleshooting)
- [Migrating from Meteor Up 0.x](#migrating-from-meteor-up-0x)
- [FAQ](#faq)

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

### Creating a Meteor Up Project
    cd my-app-folder
    mkdir .deploy
    cd .deploy
    mup init

This will create two files in your Meteor Up project directory:

  * `mup.js` - Meteor Up configuration file
  * `settings.json` - Settings for Meteor's [settings API](http://docs.meteor.com/#meteor_settings)

**If you are using Meteor Up in Command Prompt on Windows, use `mup.cmd` instead of `mup`**

### Example File

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
    volumes: { // lets you add docker volumes (optional)
      "/host/path": "/container/path", // passed as '-v /host/path:/container/path' to the docker run command
      "/second/host/path": "/second/container/path"
    },
    docker: {
      image: 'kadirahq/meteord', // (optional)
      // image: 'abernix/meteord:base', // use this image if using Meteor 1.4+
      args: [ // lets you add/overwrite any parameter on the docker run command (optional)
        "--link=myCustomMongoDB:myCustomMongoDB", // linking example
        "--memory-reservation 200M" // memory reservation example
      ],
      // (optional) Only used if using your own ssl certificates. Default is "meteorhacks/mup-frontend-server"
      imageFrontendServer: 'meteorhacks/mup-frontend-server'
    },
    servers: {
      one: {}, two: {}, three: {} // list of servers to deploy, from the 'servers' list
    },
    buildOptions: {
      serverOnly: true, // skip building mobile apps, but still build the web.cordova architecture
      debug: true,
      cleanAfterBuild: true, // default
      buildLocation: '/my/build/folder', // defaults to /tmp/<uuid>

      //set serverOnly: false if want to build mobile apps when deploying

      // Remove this property for mobileSettings to use your settings.json. (optional)
      mobileSettings: {
        yourMobileSetting: "setting value"
      },
      server: 'http://app.com', // your app url for mobile app access (optional)
      allowIncompatibleUpdates: true, //adds --allow-incompatible-updates arg to build command (optional)
    },
    env: {
      // PORT: 8000, // useful when deploying multiple instances (optional)
      ROOT_URL: 'http://app.com', // set to https to force redirect from http
      MONGO_URL: 'mongodb://localhost/meteor'
    },
    log: { // (optional)
      driver: 'syslog',
      opts: {
        "syslog-address":'udp://syslogserverurl.com:1234'
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

    // Shows progress bar while uploading bundle to server (optional)
    // You might need to disable it on CI servers
    enableUploadProgressBar: true // default false.
  },

  mongo: { // (optional)
    oplog: true,
    port: 27017,
    version: '3.4.1' // (optional), default is 3.4.1
    servers: {
      one: {},
    },
  },
};
```


### Setting Up a Server

    mup setup

Running this locally will set up the remote server(s) you have specified in mup.js for the `mup` deployments. It will take around 2-5 minutes depending on the server's performance and network availability.

### Deploying an App

    mup deploy

This will bundle the Meteor project locally and deploy it to the remote server(s). The bundling process is exactly how `meteor deploy` does it.

### Other Utility Commands

* `mup reconfig` - reconfigure app with new environment variables and Meteor settings
* `mup stop` - stop the app
* `mup start` - start the app
* `mup restart` - restart the app
* `mup logs [-f --tail=50]` - get logs

### Build Options

You can define Meteor build options in `mup.js` like this:

~~~js
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
~~~

### Additional Setup/Deploy Information

#### Deploy Wait Time

Meteor Up checks if the deployment is successful or not just after the deployment. By default, it will wait 15 seconds before the check. You can configure the wait time with the `meteor.deployCheckWaitTime` option in `mup.js`.

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

### Accessing the Database

You can't access the MongoDB from outside the server. To access the MongoDB shell you need to log into your server via SSH first and then run the following command:

    docker exec -it mongodb mongo <appName>

> Later on we'll be using a separate MongoDB instance for every app.

### Multiple Deployments

Meteor Up supports multiple deployments to a single server. Meteor Up only does the deployment; if you need to configure subdomains, you need to manually set up a reverse proxy yourself.

Let's assume we need to deploy production and staging versions of the app to the same server. The production app runs on port 80 and the staging app runs on port 8000.

We need to have two separate Meteor Up projects. For that, create two directories and initialize Meteor Up and add the necessary configurations.

In the staging `mup.js`, add a field called `appName` with the value `staging`. You can add any name you prefer instead of `staging`. Since we are running our staging app on port 8000, add an environment variable called `PORT` with the value 8000.

You also have to tell meteor to use this custom port like this:

```js
meteor: {
  ...
  env: {
    ...
    PORT: 8000
    ...
  }
  ...
}
```

Now set up both projects and deploy as you need.

### Changing `appName`

It's pretty okay to change the `appName`. But before you do so, you need to stop the project with older `appName`.

### Custom configuration and settings files

You can keep multiple configuration and settings files in the same directory and pass them to mup using the command parameters `--settings` and `--config`. For example, to use a file `mup-staging.js` and `staging-settings.json`, add the parameters like this:

    mup deploy --config=mup-staging.js --settings=staging-settings.json

### SSL Support
Meteor UP can enable SSL support for your app. It can either autogenerate the certificates, or upload them from your dev computer.

### Autogenerate certificates

Meteor Up can use Let's Encrypt to generate certificates for you. Add the following to your `mup.js` file:

```js
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

```js
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

***This Only Works if you are using the Let's Encrypt Autogenerated SSL's as it uses a different nginx container***

```js

meteor: {
   ...
   nginx: {
     clientUploadLimit: '<desired amount>' // Default is 10M
   }
   ...
}

```

### Change Mongodb Version

If you have not deployed to the server, you can change the mongo version by adding:

```js

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

    npm update mup -g

You should try and keep `mup` up to date in order to keep up with the latest Meteor changes.

### Troubleshooting

#### Check Logs
If you suddenly can't deploy your app anymore, first use the `mup logs -f` command to check the logs for error messages.

#### Verbose Output
If you need to see the output of `mup` (to see more precisely where it's failing or hanging, for example), run it like so:

    DEBUG=* mup <command>

where `<command>` is one of the `mup` commands such as `setup`, `deploy`, etc.

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

### FAQ

Q) I get a deploy verification error with logs like below (Similar to [issue 88](https://github.com/kadirahq/meteor-up/issues/88))
```
Verifying Deployment: FAILED

Error:
-----------------------------------STDERR-----------------------------------
 run:
npm WARN deprecated
npm WARN deprecated   npm -g install npm@latest
npm WARN deprecated
```

A) Try increasing the value of the `deployCheckWaitTime` field in `mup.js`.


Q) I get "Windows script error" in Windows, or it opens mup.js in an editor.

A) This happens because Windows tries to run the `mup.js` config file instead of the actual `mup` binary.
Use `mup.cmd` instead of `mup`, or use `PowerShell` instead of `Command Prompt`
