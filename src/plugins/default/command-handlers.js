import chalk from 'chalk';
import { Client } from 'ssh2';
import debug from 'debug';
import { map } from 'bluebird';

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
  process.on('exit', code => {
    if (code > 0) {
      return;
    }

    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  });

  log('exec => mup setup');

  return api.runCommand('docker.setup');
}

export function start() {
  log('exec => mup start');
}

export function stop() {
  log('exec => mup stop');
}

export function ssh(api) {
  const servers = api.getConfig().servers;
  let serverOption = api.getArgs()[1];

  if (!(serverOption in servers)) {
    if (Object.keys(servers).length === 1) {
      serverOption = Object.keys(servers)[0];
    } else {
      console.log('mup ssh <server>');
      console.log('Available servers are:\n', Object.keys(servers).join('\n '));
      process.exitCode = 1;

      return;
    }
  }

  const server = servers[serverOption];
  const sshOptions = api._createSSHOptions(server);

  const conn = new Client();
  conn.on('ready', () => {
    conn.shell((err, stream) => {
      if (err) {
        throw err;
      }
      stream.on('close', () => {
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

  if (api.getOptions().show || api.getOptions().scrub) {
    let config = api.getConfig();

    if (api.getOptions().scrub) {
      config = api.scrubConfig();
    }
    console.log(JSON.stringify(config, null, 2));
  }

  const errors = api.validateConfig('');
  if (errors.length > 0) {
    process.exitCode = 1;
  } else {
    console.log(chalk.green('\u2713 Config is valid'));
  }
}

function statusColor(
  versionCorrect,
  distributionCorrect,
  hasPackageManager,
  defaultBash,
  _overallColor
) {
  let color = chalk.green;
  let overallColor = _overallColor;

  if (!hasPackageManager) {
    color = chalk.red;
    overallColor = 'red';
  } else if (!distributionCorrect) {
    color = chalk.yellow;
    if (overallColor !== 'red') {
      overallColor = 'yellow';
    }
  } else if (!versionCorrect) {
    color = chalk.red;
    overallColor = 'red';
  } else if (!defaultBash) {
    color = chalk.red;
    overallColor = 'red';
  }

  return {
    color,
    overallColor
  };
}

export async function status(api) {
  const servers = Object.values(api.getConfig().servers);
  const lines = [];
  let overallColor = 'green';
  const command = 'lsb_release -r -s || echo "false"; lsb_release -is; apt-get -v &> /dev/null && echo "true" || echo "false"; yum -h &> /dev/null && echo "true" || echo "false"; echo $BASH';
  const results = await map(
    servers,
    server => api.runSSHCommand(server, command),
    { concurrency: 2 }
  );

  results.forEach(({ host, output }) => {
    let text = `  - ${host}: `;
    let color = chalk.green;
    const [
      version,
      distribution,
      aptGet,
      yum,
      bash = ''
    ] = output.trim().split('\n');

    let versionCorrect = false;
    let distributionCorrect = false;
    if (distribution === 'CentOS') {
      distributionCorrect = true;
      versionCorrect = parseInt(version, 10) >= 7;
    } else if (distribution === 'Ubuntu') {
      distributionCorrect = true;
      versionCorrect = parseInt(version, 10) > 13;
    }
    const hasPackageManager = aptGet.trim() === 'true' || yum.trim() === 'true';
    const defaultBash = bash.trim().length > 0;

    const colors = statusColor(
      versionCorrect,
      distributionCorrect,
      hasPackageManager,
      defaultBash,
      overallColor
    );

    color = colors.color;
    overallColor = colors.overallColor;

    text += color(`${distribution} ${version}`);
    if (!hasPackageManager) {
      text += chalk.red(' package manager (yum or apt-get) not available');
    }

    if (!defaultBash) {
      text += chalk.red(' Bash is not the default shell');
    }

    lines.push(text);
  });

  console.log(chalk[overallColor]('=> Servers'));
  console.log(lines.join('\n'));
}
