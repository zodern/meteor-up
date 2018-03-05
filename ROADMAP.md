These are the main improvements prioritized to be worked on in the short to medium term. They are listed roughly in the order that they will be worked on.

We accept pull requests and contributions for features not listed here, but the contributers will propritize their time for reviewing PR's that help implement features that are part of the roadmap.
 
## Docker Swarm

Docker Swarm will be used in the implementations for features for using multiple servers, including load balancing, rolling deploys, handling servers going down, and allowing the built-in databases to work with multiple servers.

The first implementation will have a few limitations, such as multiple apps using docker swarm can not share servers and the servers must be in the same regions. It will also require listing the manager servers in the config. Later iterations will improve this.
 
## Load balancing 
 
Uses the reverse proxy and docker swarm to load balance the app, with sticky session support.
 
## Zero-downtime deploys 
 
When the app is deployed to at least 2 servers, it can deploy the next version with no downtime. Will be enabled automatically when using the reverse proxy and docker swarm.
 
## Metrics

View realtime metrics from the mup cli, such as disk, ram, cpu, and network usage. Can show metrics for all servers, or specific servers with the `--servers` option.
 
## Improve MongoDB 

Commands to download a backup of the database, restore from a backup, and access the MongoDB shell will be added. We will also add support for the oplog, and custom mongo configs.

https://github.com/zodern/meteor-up/blob/master/docs/docs.md#backup-and-restore

## Faster bundle upload

Mup can use rsync to only upload the parts of the bundle that changed, making subsequent deploys faster. Will only be enabled when `rsync` is available, so on Windows it will fall back to uploading the whole bundle.

## Rollback or rollforward app 

With the current implementation, it is common for the previous and current versions of the app to become the same version. It also rolls back the app if it fails to start for `mup reconfig`, `mup restart`, and `mup start` even though the code didn't change and the failure could be from changes to the config.

It will be improved to only rollback after `mup deploy`. It will store 1 or 2 additional older versions, and there will be commands to manually rollback or rollforward the app, and view the available versions.

## Deploy node.js apps

Since 1.3, it's been possible to create plugins to deploy non-meteor apps. We wil add a built-in plugin to deploy Node.js apps. Additional plugin apis will be added to simplify creating similar plugins.

## Troubleshooting

Started in 1.4.

There are a handful of errors that are very common, such as a port already being used. `mup` could look at the output from failed tasks, and offer suggestions, There also can be a troubleshooting command to automate finding and sometimes even fixing problems.

# Finished

## Reverse Proxy 
 
Started in 1.2.9. Finished in 1.4. 

The implementations for custom certificates and Let's Encrypt is very different, and some features only support with one or the other, and each has it's own limitations.

The reverse proxy will use the same implementation for both. It will also support multiple apps on the server, and be more customizable, including using custom nginx configs.
