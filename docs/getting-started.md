---
layout: docs
title: 'Getting Started'
---

## Install

Install Meteor Up with one command:

```shell
npm install --global mup
```

You should install `mup` on the computer you are deploying from. Mup requires node 8 or newer.

You need at least one server to deploy to. Many companies offer them for $5 / month or less, including Digital Ocean, Vultr, and Hetzner.

The server should:

- Have at least 512MB of ram. 1GB is recommended.
- Be running Ubuntu 14 or newer.

You do not need to install anything on your servers; mup will set them up for you.

## Step 1: Initialize your project

In the terminal, run:

```shell
cd path/to/app
mkdir .deploy && cd .deploy
mup init
```

> It is a common practice to store your production settings.json and mup config in a `.deploy` folder.

## Step 2: Customize your config

There are a minimum of 5 properties in your config that need to be changed.

For each server:

- __host__ - Usually is the IP Address of the server
- __server authentication__ - You can use a `password` or set `pem` to the path of a private key. If neither are set, it uses `ssh-agent`

In the `app` section:

- __name__ - A unique name, with no spaces.
- __path__ - Path to the meteor app, relative to the config. If your config is in `app/.deploy`, the path would be `../`.
- __env.ROOT_URL__ - The url your app is accessible at. If you are using ssl, it should start with `https://`; otherwise, it should be `http://`.

## Step 3: Setup Server

**When running the Meteor Up commands in Command Prompt, you should use `mup.cmd` instead of `mup`.**

Run one command, and mup will install all of its dependencies on the server and prepare it for your first deploy:

```shell
mup setup
```

If you want to see what the tasks are doing, you can add the `--verbose` flag.

You should run `mup setup` anytime after changing your config. It is safe to run the command as many times as you need.

## Step 4: Deploy

The deploy process:

1. Builds your app, using `meteor build`
2. Uploads the app bundle, the start script, and the environment variables to your servers
3. Runs the start script
4. Verifies that the app successfully started

Run

```bash
mup deploy
```

If it failed due to a network error while uploading the bundle, you can run `mup deploy --cached-build`. It will then skip step 1 of the deploy process and use the bundle from the last time it was built.

Congratulations! Your app is now running on the server, accessible to your potential users!

## Next Steps

- [View logs]({% link docs.md%}#other-utility-commands)
- [Setup SSL]({% link docs.md%}#reverse-proxy)
- [View config options]({% link docs.md%}#example-configs)
