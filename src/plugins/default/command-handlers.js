import debug from 'debug';
import { Client } from 'ssh2';

const log = debug('mup:module:default');

export function deploy() {
  log('exec => mup deploy');
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
  // return api.runCommand('meteor.stop');
}

export function ssh(api) {
  const servers = api.getConfig().servers;
  let serverOption = api.getArgs()[1];

  if (!(serverOption in servers)) {
    if (Object.keys(servers).length === 1) {
      serverOption = Object.keys(servers)[0];
    } else {
      console.log('mup ssh <server>');
      console.log('Available servers are:\n', Object.keys(servers).join('\n'));
      process.exitCode = 1;
      return;
    }
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

export function status() {

}
