---
layout: docs
title: 'Plugins'
---
## List of plugins
  
  - [mup-aws-beanstalk](https://github.com/zodern/mup-aws-beanstalk) Deploy using AWS Elastic Beanstalk. Supports load balancing, auto scaling, and rolling deploys
  - [mup-node](https://github.com/zodern/mup-node) Deploy node apps with Meteor Up
  - [mup-docker-deploy](https://github.com/zodern/mup-docker-deploy) Use a custom Dockerfile to deploy any type of app
  - [mup-cloud-front](https://github.com/zodern/mup-cloud-front) Setup and use CloudFlare, with support for rolling deploys
  - [mup-disk](https://www.npmjs.com/package/mup-disk) Shows disk usage and cleans up old files and docker items
  - [mup-redis](https://www.npmjs.com/package/mup-redis) Set up and manage Redis
  - [mup-fix-bin-paths](https://www.npmjs.com/package/mup-fix-bin-paths) Fix npm bin paths that break deploying from Windows
  
  If you have created a plugin, create a pull request to add it to this list. 
  
  Meteor Up comes with some built-in plugins. These include:
  - `default` Handles most of the top-level commands, such as `mup setup`, `mup init`, and `mup deploy`
  - `meteor` Adds the `meteor` top-level command and adds meteor specific functionality to the `default` commands
  - `docker` Adds the `docker` top-level command and sets-up docker
  - `mongo` Adds the `mongo` top-level command and manages the MongoDB instance

## Using Plugins

Plugins are npm packages and can be installed with `npm`. You can install them locally to the app or config folders, or globally. After the plugin is installed, add a `plugin` array to your config:

```js
module.exports = {
  // ... rest of config

  plugins: ['name-of-plugin', 'name-of-other-plugin', '../path/to/plugin']
};
```

## Creating a plugin

### Getting started
Plugins can be used to add functionality to Meteor up. Examples are adding support for non-meteor apps or other databases, add commands, change the server setup, etc.

Plugins are npm packages. At the minimum, they should have:
1. `package.json` You can use `npm init` to create one
2. `index.js` Mup loads the plugin config from this file

A [boilerplate](https://github.com/zodern/mup-plugin-boilerplate) is available to help get started.

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
  },
  // (optional) Called by api.scrubConfig(),
  // which is used by `mup validate --scrub`
  scrubConfig(config) {
    // Replace any senstive information in the config,
    // such as passwords and ip addresses.

    return config;
  }
};
```

### Commands

Commands serve two purposes:

1. They can be run from the mup CLI
2. Commands can run other commands from the same plugin or other plugins

Commands can optionally be hidden from the CLI help if they are intended to only be run by other commands.

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
1. Your plugin needs to set up the servers with `mup setup`
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
The arguments that are given to mup, with global options removed (such as verbose, config, settings).

#### **getVerbose()**
Returns boolean. True if verbose is enabled.

#### **getOptions()**
Returns object, with the key being the option given to mup, and the value being the option's value.

#### **hasMeteorPackage(packageName)**
Returns true if the app is using the Meteor package. Returns false if it isn't or if it could not load `appPath/.meteor/versions`.

#### **validateConfig(configPath)**
Runs the config through all of the plugin's validators. The first time it is run, it shows any errors in the console.

Returns array of errors.

#### **getConfig(validate = true)**

Returns the config, loading it if it hasn't been loaded yet. If validate is true, it will call `api.validateConfig`. Setting `validate` to false also hides errors from not finding the config.

#### **scrubConfig()**

Returns the config after it has been modified by any `scrubConfig` functions from plugins. Most sensitive information should be removed from the config.

#### **getSettings()**
Returns the Meteor settings file, loading it if it hasn't been yet.

#### **setConfig(configObject)**
Set a new config object. Plugins can use this to add env variables or make other changes to the config.

#### **runCommand(commandName)**
Runs the command, and it's pre and post hooks.

`commandName` is in the format of `pluginName.commandName`. For example, `mongo.restart`, `docker.setup`, and `meteor.push` are all valid strings for `commandName`.

It returns a promise.

#### **getSessions(plugins[])**
Returns array of sessions for the servers listed in the plugin's config, to use in nodemiral.

For example, in the mup config, there are `app.servers` and `mongo.servers`. If your plugin wants to access the servers running mongo, you would call `getSessions(['mongo'])`; If you wanted sessions for all of the servers, you can call `getSessions(['mongo', 'app'])`.

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

#### **commandHistory**

Array of objects. Each object is in the format of `{name: 'plugin.commandName'}`, and shows what commands have already been run and in what order.

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

      // The config has an additional property, config._origionalConfig, which
      // has the config before it was normalized or prepared by plugins.
    }
  }
};
```

The validation utils are designed to be used with [joi](https://github.com/hapijs/joi).

### Validation Utils

#### VALIDATE_OPTIONS

Is an object of options that you can pass to `joi.validate`.
```ts
const VALIDATE_OPTIONS = {
  abortEarly: false,
  convert: false
};
```

#### improveErrors(error)

Changes error.message for certain error types to be easier to understand

#### addLocation(details, location)
- details is an array of errors from `combineErrorDetails`

Usually, the joi errors don't have the full path to the property. This prepends the location to each detail's path and adds the full path to the beginning of the error message.

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

#### addDepreciation(details, path, reason, link)
- details is an array
- path is the path to the depreciated property ('app.nginx')
- reason reason it is depreciated
- link is a url for more information
