# Next
- Add tips to default config, and comment what needs to be changed
- `mup init` and `mup setup` suggests what to do next
- Startup script is updated during `mup reconfig`
- Default build path is consistent between deploys for each app
- Add `--cached-build` flag to `mup deploy` which uses the build from the previous deploy
- Configure additional docker networks, ip binding, and verification port @giordanocardillo 
- Handles promise rejections
- Fix docker not always disconnecting containers from networks @joaolboing 
- Fix stderr sometimes in wrong place in logs
- Fix some lines in logs would be missing the host name
- Fix validating buildLocation
- Fix path to temp folder on Windows

# 1.2.3
- Default config uses meteor.docker object instead of dockerImage @maxmatthews
- Docker args from config are no longer escaped @maxmathews
- Add buildLocation for validator @stubbegianni
- Improved messages from validator
- Fix nginx-proxy not starting on server restart
- Fix documentation on changing port @maxmathews

# 1.2.2
- Configure nginx max client upload size, and increase default to `10M` (@shadowcodex)
- Displays better message if it can not find the meteor app
- Displays message if can not find pem for server
- Improve validating server's `host` in config
- Validator checks for `http://` or `https://` in `ROOT_URL`
- Update documentation on using `mup` on Windows

# 1.2.1
- All paths support "~"
- Add `server` and `allowIncompatibleUpdates` to build config (@alvelig)
- Allow `mobile-settings` build option to use `settings.json` file (@alvelig)
- Add `mup --version` command
- Fix validating env `variables` and `imageFrontendServer`

# 1.2.0
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

# 1.1.2
- Fixed `mup setup` when using let's encrypt

# 1.1.1
- Fixed some files had windows line endings

# 1.1

- Add let's encrypt support (@mbabauer)
- Fix typo (@timbrandin)
- Help is shown for `mup` and `mup help`
- Improved help text