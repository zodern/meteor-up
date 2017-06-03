## 1.2.9 - June 3, 2017
- Add shared nginx proxy
    - Is configured with a `proxy` object instead of using `meteor.ssl` and `meteor.nginx`
    - If multiple apps are deployed to a server, routes requests to the correct container
    - Adds `mup proxy` command. For a list of subcommands, run `mup proxy help`
    - Supports using custom certificates. This should be used instead of `meteor.ssl` since the previous image used for custom certificates had a security vulnerability.
    - Also can set up Let's Encrypt
    - Supports configuring the env variables for the nginx and let's encrypt containers.

Big thanks to @shaiamir for his work on the shared proxy.

- `mup stop` also stops nginx proxy and let's encrypt containers
- App inside container's port is set to `docker.imagePort`. The app is still accessible on `env.PORT`.
- Will build app if cached build is not found and `--cached-build` flag is set
- Fix some bugs with verifying deployment
- Add support for `zodern:mup-helpers` package. Since version 1.2.7, verifying deployment fails if the app's `/` route's http code is other than 200, or if it does not redirect on the server to a page that does have that http code. Adding `zodern:mup-helpers` allows meteor up to sucessfully validate the deployment.

## 1.2.7 - May 5, 2017
- Fix verifying deployment when using ssl autogenerate
- Add default host to nginx-proxy to redirect unknown hosts to the app when accessed over http
- Remove `force-ssl` warning and add a note about redirects to the Troubleshooting guide in the readme
- Fix example config in readme @meteorplus
- Fix setting `HTTPS_METHOD` for nginx-proxy. It will no longer redirect http to https
- Validator warns when using ssl autogenerate and setting `env.PORT`.

## 1.2.6 - March 29, 2017
- Fix `force-ssl` warning appearing when ssl is setup correctly

## 1.2.5 - March 22, 2017
- Support changing docker exposed port @abernix
- New `mup docker restart` command
- New `mup docker ps` command. It accepts all arguments that `docker ps` accepts
- Old ssh key and bundle are deleted before uploading new ones
- Setting up Mongo and Meteor are no longer in parallel
- `--verbose` flag also shows output from scripts run on the server
- MongoDB is safely shutdown for `Start Mongo` and `Stop Mongo` task lists
- Reduced number of dependencies installed
- Better error message on meteor build spawn error
- Setup tasks are consistently capitilized
- Clearer validator message for `ROOT_URL`
- Add warning message when using `force-ssl` without ssl setup
- Validate `meteor.ssl.upload` @markreid

## 1.2.4 - March 13, 2017
- Add tips to default config, and comment what needs to be changed
- `mup init` and `mup setup` suggests what to do next
- Startup script is updated during `mup reconfig`
- Default build path is consistent between deploys for each app
- Add `--cached-build` flag to `mup deploy` which uses the build from the previous deploy
- Configure additional docker networks, ip binding, and verification port @giordanocardillo
- Add `--verbose` flag to show output from `meteor build`
- Handles promise rejections
- Fix docker not always disconnecting containers from networks @joaolboing
- Fix stderr sometimes in wrong place in logs
- Fix some lines in logs would be missing the host name
- Fix validating buildLocation
- Fix path to temp folder on Windows

## 1.2.3 - March 4, 2017
- Default config uses meteor.docker object instead of dockerImage @maxmatthews
- Docker args from config are no longer escaped @maxmathews
- Add buildLocation for validator @stubbegianni
- Improved messages from validator
- Fix nginx-proxy not starting on server restart
- Fix documentation on changing port @maxmathews

## 1.2.2 - Feb 11, 2017
- Configure nginx max client upload size, and increase default to `10M` (@shadowcodex)
- Displays better message if it can not find the meteor app
- Displays message if can not find pem for server
- Improve validating server's `host` in config
- Validator checks for `http://` or `https://` in `ROOT_URL`
- Update documentation on using `mup` on Windows

## 1.2.1 - Feb 8, 2017
- All paths support "~"
- Add `server` and `allowIncompatibleUpdates` to build config (@alvelig)
- Allow `mobile-settings` build option to use `settings.json` file (@alvelig)
- Add `mup --version` command
- Fix validating env `variables` and `imageFrontendServer`

## 1.2.0 - Feb 7, 2017
- Support Meteor 1.4 by default (@ffxsam)
- Change mongo version
- Validates `mup.js` and displays problems found in it
- Update message is clearer and more colorful
- `uploadProgressBar` is part of default `mup.js`
- Add trailing commas to mup.js (@ffxsam)
- Improve message when settings.json is not found or is invalid
- Loads and parses settings.json before building the app
- Improve message when given unknown command
- Fix switching from auto-generated ssl certificates to upload certificates
- Fix `Error: Cannot find module 'ssh2'`
- Fix `mup logs` when using custom configuration or settings files

## 1.1.2 - Feb 4, 2017
- Fixed `mup setup` when using let's encrypt

## 1.1.1 - Feb 4, 2017
- Fixed some files had windows line endings

## 1.1 - Feb 4, 2017
- Add let's encrypt support (@mbabauer)
- Fix typo (@timbrandin)
- Help is shown for `mup` and `mup help`
- Improved help text