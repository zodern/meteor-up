var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');

function buildApp(appPath, buildOptions) {
  return new Promise((resolve, reject) => {
    const callback = (err) => {
      if(err) {
        return reject(err);
      }
      resolve();
    };
    buildMeteorApp(appPath, buildOptions, function(code) {
      if (code === 0) {
        archiveIt(buildOptions.buildLocation, callback);
      } else {
        console.log("\n=> Build Error. Check the logs printed above.");
        callback(new Error("build-error"));
      }
    });
  });
}

function buildMeteorApp(appPath, buildOptions, callback) {
  var executable = buildOptions.executable || 'meteor';
  var args = [
    "build", "--directory", buildOptions.buildLocation,
    "--architecture", "os.linux.x86_64",
    "--server", "http://localhost:3000"
  ];

  if(buildOptions.debug) {
    args.push("--debug");
  }

  if(buildOptions.mobileSettings) {
    args.push('--mobile-settings');
    args.push(JSON.stringify(buildOptions.mobileSettings));
  }

  if(buildOptions.serverOnly) {
    args.push('--server-only');
  }

  var isWin = /^win/.test(process.platform);
  if(isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || "cmd.exe";
    args = ["/c", "meteor"].concat(args);
  }

  var options = {cwd: appPath};
  var meteor = spawn(executable, args, options);
  var stdout = "";
  var stderr = "";

  meteor.stdout.pipe(process.stdout, {end: false});
  meteor.stderr.pipe(process.stderr, {end: false});

  meteor.on('error', (e) => {
    console.log(options);
    console.log(e);
  });
  meteor.on('close', callback);
}

function archiveIt(buildLocation, callback) {
  callback = _.once(callback);
  var bundlePath = pathResolve(buildLocation, 'bundle.tar.gz');
  var sourceDir = pathResolve(buildLocation, 'bundle');

  var output = fs.createWriteStream(bundlePath);
  var archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 6
    }
  });

  archive.pipe(output);
  output.once('close', callback);

  archive.once('error', function(err) {
    console.log("=> Archiving failed:", err.message);
    callback(err);
  });

  archive.directory(sourceDir, 'bundle').finalize();
}

module.exports = buildApp;
