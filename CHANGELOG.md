## 1.2.6 - Match 29, 20 
- Fix `force-ssl` warning appearing when ssl is setup correctly

## Next
- All commands have a description and are listed in help
- All options are shown in help
- Improve module help
- Add help for subcommands
- Help is shown when an unknown option is used
- Remove `mup proxy` and `mup docker dump` commands which were placeholders.
- Use Yargs instead of commander
- `mup help <command>` can also be used for subcommand help
- Remove  `mup meteor push`. `mup meteor deploy` should be used instead.
- Remove `mup meteor envconfig`. `mup reconfig` should be used instead

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