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
  meteor: {
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
    }
  },

  meteor: {
    name: 'app',
    path: '../app',

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
        '--link=myCustomMongoDB:myCustomMongoDB', // linking example
        '--memory-reservation 200M' // memory reservation example
      ],

      // Only used if using your own ssl certificates.
      // Default is "meteorhacks/mup-frontend-server" (optional)
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

      debug: true,

      // defaults to a a folder in your tmp folder.
      buildLocation: '/my/build/folder',

      // Remove this property for mobileSettings to use your settings.json
      mobileSettings: {
        yourMobileSetting: 'setting value'
      },

      // your app url for mobile app access
      server: 'http://app.com',

       // adds --allow-incompatible-updates arg to build command
      allowIncompatibleUpdates: true,

      // Executable used to build the meteor project
      // You can set to a local repo path if needed
      executable: 'meteor'
    },
    env: {
      // If you are using ssl, this needs to start with https
      ROOT_URL: 'http://app.com',

      MONGO_URL: 'mongodb://localhost/meteor'

      // The port you access the app on. (optional, default is 80)
      // PORT: 8000
    },

    // Docker log options (optional)
    log: {
      driver: 'syslog',
      opts: {
        'syslog-address': 'udp://syslogserverurl.com:1234'
      }
    },
    ssl: {
      // Enables let's encrypt (optional)
      autogenerate: {
        email: 'email.address@domain.com',
        // Comma seperated list of domains
        domains: 'website.com,www.website.com'
      }
    },
    // The maximum number of seconds it will wait
    // for your app to successfully start
    deployCheckWaitTime: 60, // default is 60 (optional)

    // lets you define which port to check after the deploy process, if it
    // differs from the meteor port you are serving
    // (like meteor behind a proxy/firewall) (optional)
    deployCheckPort: 80,

    // Shows progress bar while uploading bundle to server (optional)
    // You might need to disable it on CI servers
    enableUploadProgressBar: true // default false.
  },

  // (optional but remove it if you want to use a remote mongodb!)
  mongo: {
    // (optional), default is 3.4.1
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

It is safe to run `mup setup` multiple times if needed. After making changes to custom ssl certificates, mongodb, or servers in your config, you need to run `mup setup` for the changes to take effect.

## Deploying an App

    mup deploy

This will bundle the Meteor project locally and deploy it to the remote server(s). The bundling process is the same as what `meteor deploy` does.

    mup deploy --cached-build

The `--cached-build` option will use the build from the last time you deployed the app. This is useful when the previous deploy failed from a network error or from a problem in the config.

## Other Utility Commands

* `mup reconfig` - reconfigures app with new environment variables, Meteor settings, and it updates the start script. This is also the last step of `mup deploy`.
* `mup stop` - stop the app
* `mup start` - start the app
* `mup restart` - restart the app
* `mup logs [-f --tail=50]` - view the app's logs. Supports all of the flags from `docker logs`.

## Build Options

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

## Additional Setup/Deploy Information

### Deploy Wait Time

Meteor Up checks if the deployment is successful or not just after the deployment. It will wait 15 seconds after starting the docker container before starting the checks.  The check runs every second until it either can successfully load the app's client, or it runs out of time as defined in `meteor.deployCheckWaitTime`.

#### Deploy check port

If you are deploying under a proxy/firewall and need a different port to be checked after deploy, add a variable called `deployCheckPort` with the value of the port you are publishing your application to.

```ts
meteor: {
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

Add all of the servers to the `servers` object and modify `meteor.servers` to include them.

### Multiple Deployment Environments

To deploy to *different* environments (e.g. staging, production, etc.), use separate Meteor Up configurations in separate directories, with each directory containing separate `mup.js` and `settings.json` files, and set the `meteor.app` field in each config to point back to your app's directory.

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
    domains: 'myapp.com'
  }
}
```

For the staging app, `proxy.domains` would be `staging.myapp.com`.

Now set up both projects and deploy the apps.

## Docker options

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

### Image Port

You can set `meteor.docker.port` to the port to expose from the container. This does not effect the port the app is accessed on, only the port the app runs on inside the docker container.

## Reverse Proxy

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
    // comma separated list of domains your website
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

### SSL
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

### Advance configuration
The `proxy.shared` object has settings that most apps won't need to change, but if they are they apply to every app using the proxy. After you change `proxy.shared`, you need to run `mup proxy reconfig-shared` for it to take effect.

```ts
{
  proxy: {
    // Settings in "proxy.shared" will be applied to every app deployed on the servers.
    // Everything is optional.
    // After changing this object, run `mup proxy reconfig-shared`
    shared: {
      // The port number to listen to for http connections. Default 80.
      httpPort: 80,
      // The port to listen for https connections. Default is 443.
      httpsPort: 443,
      // Set proxy wide upload limit. Setting 0 will disable the limit.
      clientUploadLimit: '10M',
      // Environment variables for nginx proxy
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


## Changing `appName`

It's pretty okay to change the `appName`. But before you do so, you need to stop the project with older `appName`.

## Custom configuration and settings files

You can keep multiple configuration and settings files in the same directory and pass them to mup using the command parameters `--settings` and `--config`. For example, to use a file `mup-staging.js` and `staging-settings.json`, add the parameters like this:

    mup deploy --config=mup-staging.js --settings=staging-settings.json

## SSL Support
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

You also need to:
1. Make sure `meteor.env.ROOT_URL` starts with `https://`
2. Setup DNS for each of the domains in `meteor.ssl.autogenerate.domains`

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

If your certificate and key are already in the right location on your server and you would like to prevent Mup from overriding them while still needing an SSL setup, you can add `upload: false` in the `meteor.ssl` object.

To learn more about SSL setup when using your own certificates, refer to the [`mup-frontend-server`](https://github.com/meteorhacks/mup-frontend-server) project.

## Nginx Upload


***This Only Works if you are using the Let's Encrypt Autogenerated SSL's***

**If you are using the reverse proxy, follow [these instructions](#advance-configuration) instead.**

If you would like to increase the client upload limits, you can change it by adding:
```ts

meteor: {
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

It is recommended to use an external database instead of the one built-in to mup for apps in production. The built-in database currently does not support oplog, is not easy to backup, and only works when the app is running on one server.

Add the `mongo` object to your config:

```ts
{
  ...
  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
}
```

Before your first setup, it is recommended to change `mongo.version` to the newest version of MongoDB your app or meteor supports. After Mongo is started, it is more complex to upgrade it.

After you finished changing the config, run
```bash
mup setup
```

and
```bash
mup deploy
```

### Multiple apps use same Database
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

### Change MongoDB Version

If you have not deployed to the server, you can change the mongo version by adding:

```ts

mongo: {
  ...
  version: '<desired version>'
}

```

If you have deployed to the server, it involves a couple more steps.

1. Go to the [MongoDB manual](https://docs.mongodb.com/manual/) > Release Notes > Current version of Mongodb > Upgrade or Downgrade Standalone
2. Follow the directions listed there. You can access the MongoDB console by running `docker exec -it mongodb mongo` on the server.
3. During the steps for install or replace binaries or restarting mongodb, instead change the version in your `mup.js` and run `mup setup`.
4. To verify that it worked, run `docker ps` to check if mongodb keeps restarting. If it is, you can see what the problem is with `docker logs mongodb`

## Hooks

Hooks allow you to run a command or function before or after a cli command is run. The config looks like:

```js
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
    'post.docker.setup'(api) {
      // Same api as is given to plugin command handlers
      // If this runs asynchronous tasks, it needs to return a promise.
      const config = api.getConfig();
      return api.runSSHCommand(config.servers.one, 'docker --version');
    }
  }
};
```

The hook name format is `{pre or post}.topLevelCommand.subCommand`. For example, if you want a command to run after `mup deploy`, the hook name would be `post.deploy`. Or if you want it to run after `mup mongo restart`, the hook name would be `post.mongo.restart`.

Some cli commands run other cli commands. For example, `mup setup` runs `mup docker setup` and `mup mongo setup`. To see all of the available hooks while a command runs, use the `--show-hook-names` option.


## Updating Mup

To update `mup` to the latest version, just type:

    npm install -g mup

mup usually will let you know when there is an update available. You should try and keep `mup` up to date in order to keep up with the latest Meteor changes.

## Troubleshooting

### Check Logs
If you suddenly can't deploy your app anymore, first use the `mup logs -f` command to check the logs for error messages.

### Docker image
Make sure that the docker image you are using supports your app's meteor version.

### Update Docker
Some problems are caused by old versions of docker.

### Increase RAM
Some problems are caused by the server running out of ram.

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

The environment variable `DEBUG=mup*` gives more information on what the `mup` cli is doing.

The `--verbose` flag shows output from commands and scripts run on the server.

## Common Problems

### Verifying Deployment: FAILED

If you do not see `=> Starting meteor app on port` in the logs, your app did not have enough time to start. Try increase `meteor.deployCheckWaitTime`.

If you do see it in your logs, make sure your `ROOT_URL` starts with https or http, depending on if you are using ssl or not. If that did not fix it, create a new issue with your config and output from `mup deploy --verbose`.

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

If you are using windows, make sure you run commands with `mup.cmd <command>` instead of `mup <command>`.
If it silently fails for a different reason, please create an issue.

### Error: spawn meteor ENOENT

Make sure meteor is installed on the computer you are deploying from.

### Let's Encrypt is not working

Make sure your `meteor.env.ROOT_URL` starts with `https://`. Also, check that the dns for all of the domains in `ssl.autogenerate.domains` is correctly configured to point to the server. Port 80 needs to be open in the server so it can verify that you control the domain.

You can view the Let's Encrypt logs by running this command on the server:
```
docker logs <AppName>-nginx-letsencrypt
```
Replace `<AppName>` with the name of the app.

### Unwanted redirects to https

Make sure `force-ssl` is not in `.meteor/versions`. If it is, either your app, or a package it uses has `force-ssl` as a dependency.

## Migration Guide
`mup` is not backward compatible with Meteor Up 0.x. or `mupx`.

* Docker is now the runtime for Meteor Up
* We don't have to use Upstart any more
* You don't need to set up NodeJS version or PhantomJS manually (MeteorD will take care of it)
* We use a mongodb docker container to run the local mongodb data (it uses the old mongodb location)
* It uses Nginx and different SSL configurations
* Now we don't re-build binaries. Instead we build for the `os.linux.x86_64` architecture. (This is the same thing what meteor-deploy does)

> Use a new server if you can. Then migrate DNS accordingly. That's the easiest and safest way.

### Migrating from Mupx

Let's assume our appName is `meteor`

Remove old docker container with: `docker rm -f meteor`
Remove old mongodb container with: `docker rm -f mongodb`
If present remove nginx container with: `docker rm -f meteor-frontend`

The new config format is different from mupx.
Run `mup init` to create a new config file.
Then do `mup setup` and then `mup deploy`.

## Plugins

### Using Plugins

Plugins are npm packages, and can be installed with the `npm` tool. You can install them locally to the app or config folders, or globally (locally is recommended since it is easier for mup to find). After the plugin is installed, add a `plugin` array to your config:
```ts
{
  ...
  plugins: ['name-of-plugin', 'name-of-other-plugin']
}
```

### List of plugins

There currently are no plugins. If you have created one, create a github issue or pull request to let us know.

Meteor Up comes with some built-in plugins. These include:
- `default` Handles all of the top-level commands, such as `mup setup`, `mup init`, and `mup deploy`
- `meteor` Adds the `meteor` top-level command, and adds meteor specific functionality to the `default` commands
- `docker` Adds the `docker` top-level command, and sets-up docker
- `mongo` Adds the `mongo` top-level command, and manages the MongoDB instance

## Creating a plugin

### Getting started
Plugins can be used to add functionality to Meteor up. Examples are adding support for non-meteor apps or other databases, add commands, change the server setup, etc.

Plugins are npm packages. At the minimum, they should have:
1. `package.json` You can use `npm init` to create one
2. `index.js` Mup loads the plugin config from this file

### Plugin Config

Your plugin's `index.js` file should export an object that follows this structure:

```js
module.exports = {
  // (optional) Name of plugin. Defaults to name of package
  name: 'disk-usage',

  // Description of top-level command, shown in `mup help`
  description: 'View and manage disk usage on servers',
  commands: {
    // Object of commands
  },
  hooks: {
    // Object of hooks that
  },
  validators: {
    // Object of validators to validate the config
  },
  // (optional) Called right after the config is loaded
  prepareConfig(config) {
    // Normalize config, add env variables, etc
    return config;
  }
};
```

### Commands

Commands serve two purposes:

1. They can be run from the mup cli
2. Commands can run other commands from the same plugin or other plugins

Commands can optionally be hidden from the cli help if they are intended to only be run by other commands.

The command config is:
```js
module.exports = {
  commands: {
    // key is name of command
    logs: {
      description: 'description of command, or set to false to hide it in the help',

      // (optional) A yargs command builder.
      // Can be used to add options, disable strict mode, etc.
      // For more help, view http://yargs.js.org/docs/#api-commandmodule
      builder(yargs) {
        return yargs.option('follow', {
          alias: 'f',
          description: 'Follow log output'
        })
        .strict(false);
      },

      // This is called when the command is run.
      // If it runs asynchronous tasks, it should return a promise
      handler(api) {
        const args = api.getArgs();
        const sessions = api.getSessions(['meteor']);

        return api.getDockerLogs('mongodb', sessions, args);
      }
    }
  }
};
```

You can also set the property `name` for a command, useful when the name has characters not allowed in js variables.

### Hooks

Hooks allow you to run a function before or after commands in other plugins.

A couple examples:
1. Your plugin needs to setup the servers with `mup setup`
2. Your plugin deploys non-meteor apps, and needs to run with `mup deploy`
3. Add environmental variables for the app before `mup reconfig`

```js
module.exports = {
  hooks: {
    'post.deploy'(api) {
      const config = api.getConfig();
      if (config.app && config.app.type === 'elixir') {
        api.runCommand('elixir.deploy');
      }
    },
    'pre.mongo.start'(api) {
      api.runCommand('elixir.adjustMongoConfig');
    }
  }
};
```

Hook functions are given the same arguments as command handlers.

You should never directly call a command handler function. Instead, you should use `api.runCommand` to allow for the command's hooks to run.

### Plugin API

#### **getBasePath()**
Returns a string. Is the folder the config should be in, and all paths are relative to.

#### **getArgs()**
The arguments given to mup, with global options removed (such as verbose, config, settings).

#### **getVerbose()**
Returns boolean. True if verbose is enabled.

#### **getOptions()**
Returns object, with the key being the option given to mup, and the value being the option's value.

#### **hasMeteorPackage(packageName)**
Returns true if the app is using the Meteor package. Returns false if it isn't or if it could not load `appPath/.meteor/versions`.

#### **validateConfig(configPath)**
Runs the config through all of the plugin's validators and shows any errors in the console.

Returns array of errors.

#### **getConfig(validate = true)**

Returns the config, loading it if it hasn't been loaded yet. If validate is true, it will call `api.validateConfig`. Setting `validate` to false also hides errors from not finding the config.

#### **getSettings()**
Returns the Meteor settings file, loading it if it hasn't been yet.

#### **setConfig(configObject)**
Set a new config object. Plugins can use this to add env variables or make other changes to the config.

#### **runCommand(commandName)**
Runs the command, and it's pre and post hooks.

`commandName` is in the format of `pluginName.commandName`. For example, `mongo.restart`, `docker.setup`, and `meteor.push` all all valid strings for `commandName`.

It returns a promise.

#### **getSessions(plugins[])**
Returns array of sessions for the servers listed in the plugin's config, to use in nodemiral.

For example, in the mup config, there are `app.servers`, and `mongo.servers`. If your plugin wants to access the servers running mongo, you would call `getSessions(['mongo'])`; If you wanted sessions for all of the servers, you can call `getSessions(['mongo', 'app'])`.

#### **resolvePath(...paths)**
Same as `path.resolve`, but supports `~`.

#### **runTaskList(list, sessions, options)**
- list is a nodemiral task list.
- sessions is an array of sessions from `getSessions`
- opts is an object of options for the nodemiral task list runner

opts has an additional optional property: `verbose`. If set to true, the stdout and stderr from all tasks run on the server will be shown in the console.

Runs the nodemiral task list, and returns a promise. If any of the tasks fail, it rejects with the error. The error has a property `nodemiralHistory` which gives more details on what failed.

#### **getDockerLogs(imageName, sessions, dockerArgs)**

Returns a promise. Shows the logs to the user, prefixing the host to each line.

#### **runSSHCommand(server, command)**
server is an object from `servers` in the config

Runs the command on the server. Returns a promise.

### Validation

If plugins add new properties to the config, they can let mup know so it won't show validation errors to the user.

For example, if your plugin alerts the user when certain events happen, your user's config might look like:

```js
module.exports = {
  alerts: {
    email: 'email@domain.com',
    deployFailed: true,
    lowDisk: true
  }
  // ... rest of config
};
```

In your plugin's exported object:
```ts
module.exports = {
  validate: {
    'alerts'(config, utils) {
      // return array with validation
      // errors from validating the alerts object
    }
  }
};
```

It is recommended to use [joi](https://github.com/hapijs/joi) to validate the config.

### Validation Utils

#### VALIDATE_OPTIONS

Is an object of options that you can pass to `joi.validate`.
```ts
{
  abortEarly: false,
  convert: true
}
```

#### improveErrors(error)

Changes error.message for certain error types to be easier to understand

#### addLocation(details, location)
- details is an array of errors from `combineErrorDetails`

Usually the joi errors don't have the full path to the property. This prepends the location to each detail's path, and adds the full path to the beginning of the error message.

Returns details

#### combineErrorDetails(details, results)
- details is an array
- results is the object returned by joi.validate, or an array of error details

Combines the error details from results with the details array.

Returns details

#### serversExist(serversConfig, serversUsed)
- serversConfig is the `servers` property in the config
- serversUsed is the `servers` object used to identify which servers the plugin should use (for example, `meteor.servers`, or `mongo.servers`)

Returns array of error details for the servers that are in `serversUsed`, but missing from `serversConfig`.


