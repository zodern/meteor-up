---
layout: docs
title: 'Meteor Up - Getting Started'
header: 'Getting Started'
---

## Install

Install Meteor Up with one command:

```
npm install --global mup
``` 

Mup requires node 4 or newer.

You need at least one server to deploy to. You can get one for $5/month or less from Digital Ocean, Vultr, or OVH.

The server should:
- Have at least 512MB of ram. 1GB is recommended.
- Be running Ubuntu 14 or 16.

You do not need to install anything on your servers; mup will set them up for you.

## Step 1: Initialize your project

In the terminal, run: 
```
cd path/to/app
mkdir .deploy && cd .deploy
mup init
```

> It is a common practice to store your production settings.json and mup config in a `.deploy` folder.

## Step 2: Customize your config

There are a miniumum of 5 properties in your config that need to be changed.

For each server:
- __host__ - Usually is the IP Address of the server
- __server authentication__ - You can use a `password` or set `pem` to the path to a private key. If neither are set, it uses `ssh-agent`

In the `meteor` section:
- __name__ - A unique name, with no spaces.
- __path__ - Path to the meteor app, relative to the config. If your config is in `app/.deploy`, the path would be `../`.
- __env.ROOT_URL__ - The url your app is accessible at. If you are using ssl, it should start with `https://`; otherwise, it should be `http://`.

## Step 3: Setup Server
**When running the Meteor Up commands in Command Prompt, you should use `mup.cmd` instead of `mup`.**

Run one command, and mup will install all of it's dependencies on the server and prepare it for your first deploy:
```
mup setup
```

If you want to see what the tasks are doing, you can add the `--verbose` flag.

You should run `mup setup` anytime after changing your config. It is safe to run the command as many times as you need.
 
## Step 4: Deploy

The deploy process:

1. Builds your app, using `meteor build`
2. Uploads the app bundle, the start script, and the environment variables to your servers
3. Runs the start script
4. Verifies that the app sucessfully started

Run
```bash
mup deploy
```

If it failed due to a network error while uploading the bundle, you can run `mup deploy --cached-build`. It will then skip step 1 of the deploy process and use the bundle from the last time it was built.

Congratulations! Your app is now running on the server, accessible to your potential users!

## Next Steps

- [View logs](https://github.com/zodern/meteor-up#other-utility-commands)
- [Setup SSL](https://github.com/zodern/meteor-up#ssl-support)
- [View config options](https://github.com/zodern/meteor-up#example-config)
