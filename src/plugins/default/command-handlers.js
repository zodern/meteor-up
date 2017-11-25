import debug from 'debug';
import fs from 'fs';
import sh from 'shelljs';
import { Client } from 'ssh2';

const log = debug('mup:module:default');

sh.config.silent = true;

export function deploy() {
  log('exec => mup deploy');
}

export function init(api) {
  log('exec => mup init');

  const mupJs = api.resolvePath(__dirname, 'template/mup.js.sample');
  const settinsJson = api.resolvePath(__dirname, 'template/settings.json');
  const mupJsDst = api.resolvePath(process.cwd(), 'mup.js');

  const settingsJsonDst = api.resolvePath(process.cwd(), 'settings.json');
  const mupJsExists = fs.existsSync(mupJsDst);
  const settingsJsonExist = fs.existsSync(settingsJsonDst);

  if (!settingsJsonExist) {
    sh.cp(settinsJson, settingsJsonDst);
    console.log('Created settings.json');
  } else {
    console.log('Skipping creation of settings.json.');
    console.log(`settings.json already exist at ${settingsJsonDst}.`);
  }

  if (!mupJsExists) {
    sh.cp(mupJs, mupJsDst);

    console.log('Created mup.js');
    console.log('');
    console.log('Next Steps:');
    console.log('');
    console.log('  Open mup.js and edit the config to meet your needs.');
    console.log('  Required changes have been marked with a TODO comment.');
    console.log('');
    console.log('  Available options can be found in the docs at');
    console.log('    https://github.com/zodern/meteor-up');
    console.log('');
    console.log('  Then, run the command:');
    console.log('    mup setup');
  } else {
    console.log('Skipping creation of mup.js');
    console.log(`mup.js already exists at ${mupJsDst}`);
  }
}

export function logs() {
  log('exec => mup logs');
}

export function reconfig() {
  log('exec => mup reconfig');
}

export function restart() {
  log('exec => mup restart');
}

export function setup(api) {
  process.on('exit', function displayNextSteps(code) {
    if (code > 0) {
      return;
    }

    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  });

  log('exec => mup setup');
  const config = api.getConfig();
  return api.runCommand('docker.setup')
    .then(() => {
      if (config.proxy) {
        return api.runCommand('proxy.setup');
      }
    });
}

export function start() {
  log('exec => mup start');
}

export function stop() {
  log('exec => mup stop');
}

export function ssh(api) {
  const servers = api.getConfig().servers;
  const serverOption = api.getArgs()[1];

  if (!(serverOption in servers)) {
    console.log('mup ssh <server>');
    console.log('Available servers are:\n', Object.keys(servers).join('\n'));
    process.exitCode = 1;
    return;
  }

  const server = servers[serverOption];
  const sshOptions = api._createSSHOptions(server);

  var conn = new Client();
  conn.on('ready', function() {
    conn.shell(function(err, stream) {
      if (err) { throw err; }
      stream.on('close', function() {
        conn.end();
        process.exit();
      });

      process.stdin.setRawMode(true);
      process.stdin.pipe(stream);

      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      stream.setWindow(process.stdout.rows, process.stdout.columns);

      process.stdout.on('resize', () => {
        stream.setWindow(process.stdout.rows, process.stdout.columns);
      });
    });
  }).connect(sshOptions);
}

export function validate(api) {
  // Shows validation errors
  api.getConfig();

  if (api.getOptions()['show']) {
    let config = api.getConfig();
    if (api.getOptions()['scrub']) {
      config = api.scrubConfig();
    }
    console.log(JSON.stringify(config, null, 2));
  }

  const errors = api.validateConfig('');
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}
