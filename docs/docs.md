---
layout: 'docs'
title: 'Documentation'
---

## Server Configuration

* Auto-restart if the app crashes
* Auto-start after server reboot
* Runs with docker for better security and isolation
* Reverts to the previous version if the deployment failed
* Pre-installed PhantomJS

## Installation

    npm install -g mup

`mup` should be installed on the computer you are deploying from.

## Creating a Meteor Up Project
    cd my-app-folder
    mkdir .deploy
    cd .deploy
    mup init

***WARNING: Windows users need to use `mup.cmd` instead, as `mup` will result in unexpected behavior.***

This will create two files in your Meteor Up project directory:

  * `mup.js` - Meteor Up configuration file
  * `settings.json` - Settings for Meteor's [settings API](http://docs.meteor.com/#meteor_settings)

## Example Configs
<!-- eslint comma-dangle: 0 -->
### Minimal Config

Just the required and most common options.

```js
module.exports = {
  servers: {
    one: {
      host: '1.2.3.4',
      username: 'root',
      pem: '~/.ssh/id_rsa'
    }
  },
  app: {
    name: 'Wekan',
    path: '../',
    docker: {
      image: 'abernix/meteord:base'
    },
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true
    },
    env: {
      ROOT_URL: 'http://app.com',
      MONGO_URL: 'mongodb://localhost/meteor'
    }
  },
  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
```

### Everything Configured

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
        port: 22
      }
    },
    two: {
      host: '5.6.7.8',
      username: 'root',
      pem: '~/.ssh/id_rsa'
    },
    three: {
      host: '2.3.4.5',
      username: 'root',
      password: 'password'
    }
  },

  // Formerly named 'meteor'. Configuration for deploying the app
  app: {
    name: 'app',
    path: '../app',
    // (optional, default is meteor) Plugins can provide additional types
    type: 'meteor',

    // lets you add docker volumes (optional). Can be used to
    // store files between app deploys and restarts.
    volumes: {
      // passed as '-v /host/path:/container/path' to the docker run command
      '/host/path': '/container/path',
      '/second/host/path': '/second/container/path'
    },
    docker: {
      // Change the image to 'kadirahq/meteord' if you
      // are using Meteor 1.3 or older
      image: 'abernix/meteord:base',

      // lets you add/overwrite any parameter on
      // the docker run command (optional)
      args: [
        // linking example
        '--link=myCustomMongoDB:myCustomMongoDB',
        // memory resvevation example
        '--memory-reservation 200M'
      ],

      // (optional) It is set to true when using a docker image
      // that supports it. Builds a new docker image containing the
      // app's bundle and npm dependencies to start the app faster and
      // make deploys more reliable and easier to troubleshoot
      prepareBundle: true,
      // Additional docker build instructions, used during Prepare Bundle
      buildInstructions: [
        'RUN apt-get update && apt-get install -y imagemagick'
      ],
      // (optional, default is true) If true, the app is stopped during
      // Prepare Bundle to help prevent running out of memory when building
      // the docker image. Set to false to reduce downtime if your server has
      // enough memory or swap.
      stopAppDuringPrepareBundle: true,

      // lets you bind the docker container to a
      // specific network interface (optional)
      bind: '127.0.0.1',

      // lets you add network connections to perform after run
      // (runs docker network connect <net name> for each network listed here)
      networks: [
        'net1'
      ]
    },

    // list of servers to deploy to, from the 'servers' list
    servers: {
      one: {},
      two: {},
      three: {
        // Add or override env variables for specific servers (optional)
        env: {
          PORT: 5000
        }
      }
    },

    // All options are optional.
    buildOptions: {
      // Set to true to skip building mobile apps
      // but still build the web.cordova architecture. (recommended)
      serverOnly: true,

      // Set to true to disable minification and bundling,
      // and include debugOnly packages
      debug: false,

      // defaults to a a folder in your tmp folder.
      buildLocation: '/my/build/folder',

      // Remove this property for mobileSettings to use your settings.json
      mobileSettings: {
        yourMobileSetting: 'setting value'
      },

      // your app url for mobile app access
      server: 'http://app.com',

      // When true, adds --allow-incompatible-updates arg to build command
      allowIncompatibleUpdates: false,

      // Executable used to build the meteor project
      // You can set to a local repo path if needed
      executable: 'meteor'
    },
    env: {
      // If you are using SSL, this needs to start with https
      ROOT_URL: 'http://app.com',

      // When using the built-in mongodb,
      // this is overwritten with the correct url
      MONGO_URL: 'mongodb://localhost/meteor'

      // The port you access the app on. (optional, default is 80)
      // PORT: 8000

      // The number of proxies in front of your server (optional, default is
      // 1 with reverse proxy, unused otherwise).
      // https://docs.meteor.com/api/connections.html
      // HTTP_FORWARDED_COUNT: 1
    },

    // Docker log options (optional)
    log: {
      driver: 'syslog',
      opts: {
        'syslog-address': 'udp://syslogserverurl.com:1234'
      }
    },
    // The maximum number of seconds it will wait
    // for your app to successfully start (optional, default is 60)
    deployCheckWaitTime: 60,

    // lets you define which port to check after the deploy process, if it
    // differs from the meteor port you are serving
    // (like meteor behind a proxy/firewall) (optional)
    deployCheckPort: 80,

    // Shows progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    // (optional, default is false)
    enableUploadProgressBar: true
  },

  // (optional) Use built-in mongodb. Remove it to use a remote MongoDB
  mongo: {
    // (optional, default is 3.4.1) Version of MongoDB
    version: '3.4.1',

    servers: {
      one: {}
    }
  }
};
```

## Setting Up a Server

    mup setup

Running this locally will set up the remote servers you have specified in your config. It will take around 2-5 minutes depending on the server's performance and network availability.

It is safe to run `mup setup` multiple times if needed. After making changes to custom SSL certificates, MongoDB, or servers in your config, you need to run `mup setup` for the changes to take effect.

## Deploying an App

```bash
mup deploy
```

This will bundle the Meteor project locally and deploy it to the remote server(s). The bundling process is the same as what `meteor deploy` does.

```bash
mup deploy --cached-build
```

The `--cached-build` option will use the build from the last time you deployed the app. This is useful when the previous deploy failed from a network error or from a problem in the config.

## Other Utility Commands

* `mup reconfig` - reconfigures app with new environment variables, Meteor settings, and it updates the start script. This is also the last step of `mup deploy`.
* `mup stop` - stop the app
* `mup start` - start the app
* `mup restart` - restart the app
* `mup logs [-f --tail=50]` - view the app's logs. Supports all of the flags from `docker logs`.

## Meteor Support

Mup supports Meteor 1.2 and newer, though you might need to change the docker image in your mup config.

| Meteor version | Docker image | Prepare Bundle | Notes |
| --- | --- | --- |
| 1.2 - 1.3 | `kadirahq/meteord` | false | This is the default docker image. When using Meteor 1.2, `app.buildOptions.serverOnly` should be false. |
| 1.4 - 1.5 | `abernix/meteord:base` | true |  |
| 1.6 | `abernix/meteord:node-8.4.0-base` | true | |
| 1.2 - 1.6 | `zodern/meteor:root` | true | Automatically uses the correct node version. |
| 1.9 | `abernix/meteord:node-12-base` | true | |

When using an image that supports `Prepare Bundle`, deployments are easier to debug and more reliable.

## Build Options

You can define Meteor build options in `mup.js` like this:

```ts
...
app: {
  buildOptions: {
    // Set to true to disable minification and bundling,
    // and include debugOnly packages
    debug: false,
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

## Additional Setup/Deploy Information

### Deploy Wait Time

Meteor Up checks if the deployment is successful or not just after the deployment. It will wait 15 seconds after starting the docker container before starting the checks.  The check runs every second until it either can successfully load the app's client, or it runs out of time as defined in `meteor.deployCheckWaitTime`.

#### Deploy check port

If you are deploying under a proxy/firewall and need a different port to be checked after deploy, add a variable called `deployCheckPort` with the value of the port you are publishing your application to.

```ts
app: {
 ...
  deployCheckPort: 80
 ...
}
```

### SSH keys with passphrase (or ssh-agent support)

> This only tested with Mac/Linux

It's common to use passphrase enabled SSH keys to add an extra layer of protection to your SSH keys. You can use those keys with `mup` too. In order to do that, you need to use `ssh-agent`.

Here's the process:

* Remove the `pem` field from `mup.js` so your `mup.js` has `username` and `host` only.
* Start ssh agent with `eval $(ssh-agent)`
* Add your ssh key with `ssh-add <path-to-key>`
* You'll be asked to enter the passphrase to the key
* After that, simply invoke `mup` commands and they'll just work
* Once you've deployed your app, kill ssh agent with `ssh-agent -k`

### SSH based authentication with `sudo`

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

### Server Setup Details

Meteor Up uses Docker to run and manage your app. It uses [MeteorD](https://github.com/meteorhacks/meteord) behind the scenes. Here's how we manage and utilize the server.

* Your currently running meteor bundle lives at `/opt/<appName>/current`
* We have a demonized docker container running the above bundle
* The docker container is started with `--restart=always` flag and it'll re-spawn the container if it dies
* Logs are maintained via Docker
* If you decided to use MongoDB, it will be running as its own Docker container. It's bound to the local interface and to port `27017` (you cannot access it from the outside)
* The database is named `<appName>`

### Deploy to multiple servers

Add all of the servers to the `servers` object and modify `app.servers` to include them.

### Multiple Deployment Environments

To deploy to *different* environments (e.g. staging, production, etc.), use separate Meteor Up configurations in separate directories, with each directory containing separate `mup.js` and `settings.json` files, and set the `app.path` field in each config to point back to your app's directory.

### Multiple Deployments

Meteor Up supports multiple deployments to a single server. To route requests to the correct app, use the [reverse proxy](#reverse-proxy).

Let's assume we need to deploy production and staging versions of the app to the same server. The production is at myapp.com, and staging is at staging.myapp.com.

We need to have two separate Meteor Up projects. For that, create two directories, initialize Meteor Up, and add the necessary configurations.

In the staging `mup.js`, change the field `app.name` to have the value `staging`. You can add any name you prefer instead of `staging`.

Next, add the proxy object to both configs. For your production app, it would be:

```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'myapp.com'
  }
};
```

For the staging app, `proxy.domains` would be `staging.myapp.com`.

Now, set up both projects and deploy the apps.

## Docker options

### Customize docker image

During `Prepare Bundle`, mup builds a new docker image that includes your app's code. You can customize this image by adding additional build instructions that are run before adding your app. This can be used to install dependencies your app needs, such as adding `imagemagick` or node-canvas's dependencies.

You can add instructions with `app.docker.buildInstructions`. An example is:
```js
module.exports = {
  app: {
    name: 'app',
    path: '../',
    servers: { one: {} },
    docker: {
      buildInstructions: [
        'RUN apt-get update && apt-get install -y imagemagick'
      ]
    }
  }
};
```

Each item is added on a new line in the `Dockerfile`, and should start with `RUN`, `USER`, or another dockerfile instruction.
If the base docker image runs the app as a non-root user, you might need to switch the user to root for your RUN commands, and back to the non-root user afterwards.

After changing the config, run `mup deploy`.

### Listening to specific IP address (IP Binding)

If you want Docker to listen only on a specific network interface, such as `127.0.0.1`, add a variable called `bind` with the value of the IP address you want to listen to.

```ts
app: {
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
app: {
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

### Custom Docker Registry

Simply reference the docker image by url in the `meteor.docker.image` setting:

```
app: {
 ...
  docker: {
    ...
    image: 'registry.gitlab.com/someregistry/someimage:sometag'
  }
}
```

And then add a docker setup hook to login to your private registry on the server. See [Hooks](#hooks) for example of logging into a private docker registry.

### Image Port

You can set `meteor.docker.imagePort` to the port to expose from the container. This does not affect the port the app is accessed on, only the port the app runs on inside the docker container.

## Reverse Proxy

Meteor Up can create a nginx reverse proxy that will handle SSL, and, if you are running multiple apps on the server, it will route requests to the correct app. The proxy is shared between all apps on the servers.

This replaces the former nginx setup, configured using `meteor.ssl` and `meteor.nginx`.

Remove `meteor.ssl` and `meteor.nginx` from your config and add a `proxy` section:

```js
module.exports = {
  // ... rest of config

  proxy: {
    // comma-separated list of domains your website
    // will be accessed at.
    // You will need to configure your DNS for each one.
    domains: 'website.com,www.website.com'
  }
};
```

The first time you setup the reverse proxy, you need to stop every app running on the servers:
```bash
mup stop
```

Then, run
```bash
mup setup
mup reconfig
```

### SSL
Add an `ssl` object to your `proxy` config:
```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com,www.website.com',
    ssl: {
      // Enable let's encrypt to create free certificates.
      // The email is used by Let's Encrypt to notify you when the
      // certificates are close to expiring.
      letsEncryptEmail: 'email@domain.com'
    }
  }
};
```

For Let's Encrypt to work, you also need to:
1. Make sure `meteor.env.ROOT_URL` starts with `https://`
2. Setup DNS for each of the domains in `proxy.domains` to point to the server
3. Open port 80 if it isn't. That port is used to verify that you control the domain.

After changing the config, run `mup setup` and `mup reconfig`. It will automatically create the certificates and setup SSL, which can take up to a few minutes. The certificates will be automatically renewed when they expire within 30 days.

If you are using custom certificates instead, it would look like:
```js
module.exports = {
  // .. rest of config

  proxy: {
    domains: 'website.com,www.website.com',
    ssl: {
      crt: './bundle.crt',
      key: './private.pem'
    }
  }
};
```
Then run `mup setup`.

You can view the list of certificates and when they expire by running `mup status`.

### Redirect http to https

In your config, add:
```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com,www.website.com',
    ssl: {
      forceSSL: true
    }
  }
};
```

It uses HSTS. This means that if you set it to `false` after it's been true, the browser used by anyone that visited it while it was set to true will still be redirected to `https` for one year.

### Custom NGINX Config

The nginx config is generated based on the docker containers running on the same server. At this time, it is not possible to modify the majority it. However, you can modify the server and `/` location blocks for the app. It is also possible to add a config that is used proxy-wide, and can add additional `upstream` and `server` blocks.

To extend the server block for the app, save the rules to a file and add the path to your config:

```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com',
    nginxServerConfig: './path/to/config'
  }
};
```

To modify the `/` location block, save the rules to a file and add the path to your config:

```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com',
    nginxLocationConfig: './path/to/config'
  }
};
```

To learn about the nginx config used proxy-wide, look at the `proxy.shared` example in the [`advanced configuration`](#advanced-configuration) docs.

You can view the generated config by running

```bash
mup proxy nginx-config
```

There will be `include` statements for each custom config.

### Advanced configuration

These are additional options that can be used to customize the reverse proxy. The defaults are compatible with most apps.

```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com,www.website.com',

    // (optional, default=10M) Limit for the size of file uploads.
    // Set to 0 disables the limit.
    clientUploadLimit: '50M'
  }
};
```

The `proxy.shared` object has settings that most apps won't need to change, but if they are they apply to every app using the proxy. After you change `proxy.shared`, you need to run `mup proxy reconfig-shared` for it to take effect.

```js
module.exports = {
  // ... rest of config

  proxy: {
    domains: 'website.com,www.website.com',

    // Settings in "proxy.shared" will be applied to every app
    // deployed on the servers using the reverse proxy.
    // Everything is optional.
    // After changing this object, run `mup proxy reconfig-shared`
    shared: {
      // The port number to listen to for http connections. Default 80.
      httpPort: 80,
      // The port to listen for https connections. Default is 443.
      httpsPort: 443,
      // Add an nginx config that is used proxy-wide.
      // This config can add additional upstream and server blocks if needed.
      nginxConfig: './path/to/config',
      // Environment variables for nginx proxy
      env: {
        DEFAULT_HOST: 'foo.bar.com'
      },
      // env for the jrcs/letsencrypt-nginx-proxy-companion container
      envLetsEncrypt: {
        // Directory URI for the CA ACME API endpoint
        // (default: https://acme-v01.api.letsencrypt.org/directory).
        // If you set it's value to
        // https://acme-staging.api.letsencrypt.org/directory
        // letsencrypt will use test servers that
        // don't have the 5 certs/week/domain limits.
        ACME_CA_URI: 'https://acme-v01.api.letsencrypt.org/directory',

        // Set it to true to enable debugging of the entrypoint script and
        // generation of LetsEncrypt certificates,
        // which could help you pin point any configuration issues.
        DEBUG: true
      }
    }
  }
};
```


## Changing the App's Name

It's okay to change `app.name`. But before you do so, you need to stop the project with older `appName`. Also, if you use the built-in MongoDB, mup will create a new database with the new name so you will need to migrate the data.

1. Run `mup stop`
2. Change the app name in the config
3. Run `mup setup` and `mup deploy`

## Custom configuration and settings files

You can keep multiple configuration and settings files in the same directory and pass them to mup using the command parameters `--settings` and `--config`. For example, to use a file `mup-staging.js` and `staging-settings.json`, add the parameters like this:

    mup deploy --config=mup-staging.js --settings=staging-settings.json

## SSL Support

**This is depreciated. Use the [reverse proxy](#ssl) to setup ssl instead.**


Meteor UP can enable SSL support for your app. It can either autogenerate the certificates or upload them from your dev computer.


### Autogenerate certificates

**This is depreciated. Use the [reverse proxy](#ssl) to setup ssl instead.**

Meteor Up can use Let's Encrypt to generate certificates for you. Add the following to your `mup.js` file:

```ts
app: {
  ...
  ssl: {
    autogenerate: {
      email: 'email.address@domain.com',
      domains: 'website.com,www.website.com'
    }
  }
}

```

You also need to:
1. Make sure `meteor.env.ROOT_URL` starts with `https://`
2. Set up DNS for each of the domains in `meteor.ssl.autogenerate.domains`

Then run `mup deploy`. It will automatically create certificates and set up SSL, which can take up to a few minutes. The certificates will be automatically renewed when they expire within 30 days.

### Upload certificates

**This is depreciated. Use the [reverse proxy](#ssl) to setup ssl instead.**

To upload certificates instead of having the server generate them for you, just add the following configuration to your `mup.js` file.

```ts
app: {
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

If your certificate and key are already in the right location on your server and you would like to prevent Mup from overriding them while still needing an SSL setup, you can add `upload: false` in the `meteor.ssl` object.

To learn more about SSL setup when using your own certificates, refer to the [`mup-frontend-server`](https://github.com/meteorhacks/mup-frontend-server) project.

## Nginx Upload

**This is depreciated. Use the [reverse proxy](#ssl) to configure this instead.**

***This Only Works if you are using the Let's Encrypt Autogenerated SSL's***


If you would like to increase the client upload limits, you can change it by adding:
```ts

app: {
   ...
   nginx: {
     clientUploadLimit: '<desired amount>' // Default is 10M
   }
   ...
}

```

## MongoDB

### External Database

To use an external database:

1. Remove the `mongo` object from your config
2. Set `meteor.env.MONGO_URL` to point to the external Mongo instance

Two popular Mongo DbaaS's are [Compose](https://www.compose.com/mongodb) and [mLab](https://mlab.com/).

### Built-in Database
Meteor Up can start a MongoDB instance on the server and set `meteor.env.MONGO_URL` to connect to it.

It is recommended to use an external database instead of the one built-in to mup for apps in production. The built-in database is not easy to backup, and only works when the app is running on one server.

Add the `mongo` object to your config:

```js
module.exports = {
  // .. rest of config

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
```

To use the oplog, set `app.env.MONGO_OPLOG_URL` to `mongodb://mongodb/local`.

Before your first setup, it is recommended to change `mongo.version` to the newest version of MongoDB your app or meteor supports. After Mongo is started, it is more complex to upgrade it.

After you finished changing the config, run
```bash
mup setup
```

and
```bash
mup deploy
```

### Multiple apps use the same database
It is possible for two apps to use the same database from the built-in MongoDB instance.

In the config for one of the apps, follow the instructions for [Built-in Database](#built-in-database).

For the other apps:
1. Make sure the `mongo` object is not in the config
2. Change `env.MONGO_URL` to `mongodb://mongodb:27017/<app1 name>`
3. Change `meteor.docker.args` to `[ '--link=mongodb:mongodb' ]`. `meteor.docker` will look similar to:

```ts
    docker: {
      // change to 'kadirahq/meteord' if your app is using Meteor 1.3 or older
      image: 'abernix/meteord:base',
      args: [
        '--link=mongodb:mongodb'
      ]
    }
```

### Accessing the Database

You can't access the MongoDB from outside the server. To access the MongoDB shell you need to log into your server via SSH first and then run the following command:

    docker exec -it mongodb mongo <appName>

### View MongoDB Logs

If you are experiencing problems with MongoDB (such as it frequently restarting), you can view the logs with

```bash
mup mongo logs
```

### Backup and restore

For backup you can use:
```sh
ssh root@host "docker exec mongodb mongodump -d meteor --archive --gzip" > dump.gz
```
and for restore:
```sh
cat dump.gz | ssh root@host "cat | docker exec -i mongodb mongorestore --archive --gzip" # use --drop if you want to drop existing collections first
```

### Change MongoDB Version

If you have not deployed to the server, you can change the mongo version by adding:

```ts

mongo: {
  ...
  version: '<desired version>'
}

```

If you have deployed to the server, it involves a couple more steps.

1. Go to the [MongoDB manual](https://docs.mongodb.com/manual/) > Release Notes > Current version of MongoDB > Upgrade or Downgrade Standalone
2. Follow the directions listed there. You can access the MongoDB console by running `docker exec -it mongodb mongo` on the server.
3. During the steps for install or replace binaries or restarting MongoDB, instead change the version in your `mup.js` and run `mup setup`.
4. To verify that it worked, run `docker ps` to check if MongoDB keeps restarting. If it is, you can see what the problem is with `docker logs mongodb`

## Hooks

Hooks allow you to run a command or function before or after a CLI command is run. The config looks like:

```js
const childProcess = require('child_process');

module.exports = {
  hooks: {
    hookName: {
      localCommand: 'command to run on computer',
      remoteCommand: 'command to run on every server'
    },
    'pre.deploy': {
      localCommand: 'npm prune --production'
    },
    'post.meteor.restart': {
      remoteCommand: 'docker logs --tail 50 app-name'
    },
    'pre.reconfig'(api) {
      // Same api as is given to plugin command handlers
      // If this runs asynchronous tasks, it needs to return a promise.
      const gitHash = childProcess.execSync('git rev-parse HEAD').toString().trim();

      api.getSettings();
      api.settings.GIT_HASH = gitHash;
    },
    'post.docker.setup'(api) {
      // Login to private Gitlab docker registry
      const config = api.getConfig();
      const registry = 'registry.gitlab.com';
      const username = process.env.REGISTRY_USERNAME;
      const password = process.env.REGISTRY_PASSWORD;

      if (!username || !password) {
        throw new Error(
          'You must provide registry login details'
        );
      }

      return api.runSSHCommand(
        config.servers.one,
        `docker login -u ${username} -p ${password} ${registry}`
      );
    }
  }
};
```

The hook name format is `{pre or post}.topLevelCommand.subCommand`. For example, if you want a command to run after `mup deploy`, the hook name would be `post.deploy`. Or if you want it to run after `mup mongo restart`, the hook name would be `post.mongo.restart`.

Some CLI commands run other CLI commands. For example, `mup setup` runs `mup docker setup` and `mup mongo setup`. To see all of the available hooks while a command runs, use the `--show-hook-names` option.


## Updating Mup

To update `mup` to the latest version, just type:

    npm install -g mup

mup usually will let you know when there is an update available. You should try and keep `mup` up to date in order to keep up with the latest Meteor changes.

## Troubleshooting

### Check Logs
If you suddenly can't deploy your app anymore, first use the `mup logs -f` command to check the logs for error messages.

You can also view logs for:
- Built-in MongoDB with `mup mongo logs`
- Reverse proxy with `mup proxy logs`
- Let's Encrypt with `mup proxy logs-le`

### Run mup status

`mup status` checks the servers for any potential problems, as well as shows you the status of any docker containers or services running on the servers.

### Docker image
Make sure that the docker image you are using supports your app's meteor version.

### Update Docker
Some problems are caused by old versions of docker. Since mup 1.3, `mup setup` and `mup docker setup` will update Docker if it is older than 1.13.

### Check if Docker Containers are Restarting
You can view a list of Docker containers with
```bash
mup docker ps
```

and check the `STATUS` column.

### Verbose Output
If you need to see the output of `mup` (to see more precisely where it's failing or hanging, for example), run it like so:

    DEBUG=mup* mup <command> --verbose

where `<command>` is one of the `mup` commands such as `setup`, `deploy`, etc.

The environment variable `DEBUG=mup*` gives more information on what the `mup` CLI is doing.

The `--verbose` flag shows output from commands and scripts run on the server.

## Common Problems

### Verifying Deployment: FAILED

If you do not see `=> Starting meteor app on port` in the logs, your app did not have enough time to start. Try increase `meteor.deployCheckWaitTime`. This only applies if `Prepare Bundle` is disabled.

If you do see it in your logs, make sure your `ROOT_URL` starts with https or http, depending on if you are using SSL or not. If that did not fix it, create a new issue with your config and output from `mup deploy --verbose`.

If you are using Meteor 1.3, you might see this error:
```
/bundle/bundle/programs/server/node_modules/fibers/future.js:280
						throw(ex);
						^

ReferenceError: module is not defined
    at app/mup.js:1:-27
```

This error happens when your config gets bundled with the app. Try moving it and your `settings.json` to a hidden folder (such as `app/.deploy`) or to a location outside of the app's folder.

### Mup silently fails, mup.js file opens instead, or you get a Windows script error

If you are using Windows, make sure you run commands with `mup.cmd <command>` instead of `mup <command>`, or use PowerShell.
If it silently fails for a different reason, please create an issue.

### Error: spawn meteor ENOENT

Make sure meteor is installed on the computer you are deploying from.

### Let's Encrypt is not working

Make sure your `meteor.env.ROOT_URL` starts with `https://`. Also, check that the DNS for all of the domains in `ssl.autogenerate.domains` is correctly configured to point to the server. Port 80 needs to be open on the server so it can verify that you control the domain.

You can view the Let's Encrypt logs by running this command on the server:
```
docker logs <AppName>-nginx-letsencrypt
```
Replace `<AppName>` with the name of the app.

### Prepare Bundle ends with `Killed`

The server ran out of memory during `npm install`. Try increasing the server's ram or creating a swap file.

### Unwanted redirects to https

Make sure `force-ssl` is not in `.meteor/versions`. If it is, either your app or a package it uses has `force-ssl` as a dependency.

## Migration Guide
`mup` is not backward compatible with Meteor Up 0.x. or `mupx`.

* Docker is now the runtime for Meteor Up
* We don't have to use Upstart anymore
* You don't need to set up NodeJS version or PhantomJS manually (MeteorD will take care of it)
* We use a mongodb docker container to run the local MongoDB data (it uses the old MongoDB location)
* It uses Nginx and different SSL configurations
* Now we don't re-build binaries. Instead, we build for the `os.linux.x86_64` architecture. (This is the same thing what meteor-deploy does)

> Use a new server if you can. Then migrate DNS accordingly. That's the easiest and safest way.

### Migrating from Mupx

Let's assume our appName is `meteor`

Remove old docker container with `docker rm -f meteor`
Remove old mongodb container with `docker rm -f mongodb`
If present remove nginx container with `docker rm -f meteor-frontend`

The new config format is different from mupx.
Run `mup init` to create a new config file.
Then do `mup setup` and then `mup deploy`.

