---
layout: docs
title: 'Meteor Up - Getting Started'
---
# Getting started

## Prequisites

You need to have the following installed:

- Meteor
- Node.js (4.0 or newer) and npm

Install Meteor Up with `npm install --global mup`.

You need at least one server to deploy to. You can get one for $5/month or less from Digital Ocean, Vultr, or OVH.

## Step 1: Initialize your project

In the terminal, run: 
```
cd path/to/app
mkdir .deploy
cd .deploy && mup init
```

> It is a common practice to store your production settings and mup config in a `.deploy` folder.

## Step 2: Customize your config

There are a miniumum of 5 properties in your config that need to be changed.

For each server:
- __host__ - Usually is the IP Address of the server
- __server authentication__ - You can use a `password` or set `pem` to the path to a private key. If neither are set, it uses `ssh-agent`

In the `meteor` section:
- __name__ - A unique name, with no spaces
- __path__ - Path to the meteor app, relative to the config
- __env.ROOT_URL__ - The url your app is accessible at. If you are using ssl, it should start with `https://`; otherwise, it should be `http://`

## Step 3: Setup Server
**When running the Meteor Up commands in Command Prompt, you should use `mup.cmd` instead of `mup`.**

Run:
```
mup setup
```

If you want to see what the tasks are doing, you can add the `--verbose` flag.

You should run `mup setup` after changing your config. It is safe to run multiple times.
 
## Step 4: Deploy

Run:
```bash
mup deploy
```

The deploy process:
1) Builds your app, using `meteor build`
2) Uploads the app bundle, the start script, andm the environment variables
3) Runs the start script
4) Verifies that the app sucessfully started

## Next Steps

[View logs]()

[Setup SSL]()

[Deploy from CI]()

[Production Checklist]()
