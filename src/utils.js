import { Client } from 'ssh2';
import debug from 'debug';
import expandTilde from 'expand-tilde';
import fs from 'fs';
import net from 'net';
import nodemiral from '@zodern/nodemiral';
import path from 'path';
import { promisify } from 'bluebird';
import readline from 'readline';
import stream from 'stream';

const log = debug('mup:utils');

export function addStdioHandlers(list) {
  list._taskQueue = list._taskQueue.map(task => {
    task.options = task.options || {};

    task.options.onStdout = () => data => {
      process.stdout.write(data);
    };

    task.options.onStderr = () => data => {
      process.stderr.write(data);
    };

    return task;
  });
}

export function runTaskList(list, sessions, opts) {
  if (opts && opts.verbose) {
    addStdioHandlers(list);
    delete opts.verbose;
  }

  if (opts && opts.showDuration) {
    list._taskQueue.forEach(task => {
      task.options = task.options || {};
      task.options.showDuration = true;
    });
    delete opts.showDuration;
  }

  return new Promise((resolve, reject) => {
    list.run(sessions, opts, summaryMap => {
      for (const host in summaryMap) {
        if (summaryMap.hasOwnProperty(host)) {
          const summary = summaryMap[host];

          if (summary.error) {
            const error = summary.error;

            error.nodemiralHistory = summary.history;
            reject(error);

            return;
          }
        }
      }

      resolve();
    });
  });
}

// Implements a simple readable stream to pass
// the logs from nodemiral to readline which
// then splits it into individual lines.
class Callback2Stream extends stream.Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);

    this.data = [];
  }
  addData(data) {
    if (this.reading) {
      this.reading = this.push(data);
    } else {
      this.data.push(data);
    }
  }
  _read() {
    this.reading = true;
    this.data.forEach(() => {
      const shouldContinue = this.reading && this.push(this.data.shift());

      if (!shouldContinue) {
        this.reading = false;
      }
    });
  }
}

export function getDockerLogs(name, sessions, args, showHost = true) {
  const command = `sudo docker ${args.join(' ')} ${name} 2>&1`;

  log(`getDockerLogs command: ${command}`);

  const promises = sessions.map(session => {
    const input = new Callback2Stream();
    const host = showHost ? `[${session._host}]` : '';
    const lineSeperator = readline.createInterface({
      input,
      terminal: true
    });

    lineSeperator.on('line', data => {
      console.log(host + data);
    });
    const options = {
      onStdout: data => {
        input.addData(data);
      },
      onStderr: data => {
        // the logs all come in on stdout so stderr isn't added to lineSeperator
        process.stdout.write(host + data);
      }
    };

    return promisify(session.execute.bind(session))(command, options);
  });

  return Promise.all(promises);
}

export function createSSHOptions(server) {
  const sshAgent = process.env.SSH_AUTH_SOCK;
  const ssh = {
    host: server.host,
    port: (server.opts && server.opts.port) || 22,
    username: server.username
  };

  if (server.pem) {
    ssh.privateKey = fs.readFileSync(resolvePath(server.pem), 'utf8');
  } else if (server.password) {
    ssh.password = server.password;
  } else if (sshAgent && fs.existsSync(sshAgent)) {
    ssh.agent = sshAgent;
  }

  return ssh;
}

function runSessionCommand(session, command) {
  return new Promise((resolve, reject) => {
    let client;
    let done;

    // callback is called synchronously
    session._withSshClient((_client, _done) => {
      client = _client;
      done = _done;
    });

    let output = '';

    client.execute(
      command,
      {
        onStderr: data => {
          output += data;
        },
        onStdout: data => {
          output += data;
        }
      },
      (err, result) => {
        // eslint-disable-next-line callback-return
        done();

        if (err) {
          return reject(err);
        }

        resolve({
          code: result.code,
          output,
          host: session._host
        });
      }
    );
  });
}

// info can either be an object from the server object in the config
// or it can be a nodemiral session
export function runSSHCommand(info, command) {
  if (info instanceof nodemiral.session) {
    return runSessionCommand(info, command);
  }

  return new Promise((resolve, reject) => {
    const ssh = createSSHOptions(info);
    const conn = new Client();

    conn.connect(ssh);

    conn.once('error', err => {
      if (err) {
        reject(err);
      }
    });

    // TODO handle error events
    conn.once('ready', () => {
      conn.exec(command, (err, outputStream) => {
        if (err) {
          conn.end();
          reject(err);

          return;
        }

        let output = '';

        outputStream.on('data', data => {
          output += data;
        });

        outputStream.stderr.on('data', data => {
          output += data;
        });

        outputStream.once('close', code => {
          conn.end();
          resolve({ code, output, host: info.host });
        });
      });
    });
  });
}

export function forwardPort({
  server,
  localAddress,
  localPort,
  remoteAddress,
  remotePort,
  onReady,
  onError,
  onConnection = () => {}
}) {
  const sshOptions = createSSHOptions(server);
  const netServer = net.createServer(netConnection => {
    const sshConnection = new Client();
    sshConnection.on('ready', () => {
      sshConnection.forwardOut(
        localAddress,
        localPort,
        remoteAddress,
        remotePort,
        (err, sshStream) => {
          if (err) {
            return onError(err);
          }
          onConnection();
          netConnection.pipe(sshStream);
          sshStream.pipe(netConnection);
        }
      );
    }).connect(sshOptions);
  });

  netServer.listen(localPort, localAddress, error => {
    if (error) {
      onError(error);
    } else {
      onReady();
    }
  });
}

export function countOccurences(needle, haystack) {
  const regex = new RegExp(needle, 'g');
  const match = haystack.match(regex) || [];

  return match.length;
}

export function resolvePath(...paths) {
  const expandedPaths = paths.map(_path => expandTilde(_path));

  return path.resolve(...expandedPaths);
}

/**
 * Checks if the module not found by `require` is a certain module
 *
 * @param {Error} e - Error that was thrown
 * @param {String} modulePath - path to the module to compare the error to
 * @returns {Boolean} true if the modulePath and path in the error is the same
 */
export function moduleNotFoundIsPath(e, modulePath) {
  const message = e.message.split('\n')[0];
  const pathPosition = message.length - modulePath.length - 1;

  return message.indexOf(modulePath) === pathPosition;
}

export function argvContains(argvArray, option) {
  if (argvArray.indexOf(option) > -1) {
    return true;
  }

  return argvArray.find(value => value.indexOf(`${option}=`) > -1);
}

export function createOption(key) {
  if (key.length > 1) {
    return `--${key}`;
  }

  return `-${key}`;
}

export function filterArgv(argvArray, argv, unwanted) {
  const result = argv._.slice();

  Object.keys(argv).forEach(key => {
    const option = createOption(key);

    if (
      unwanted.indexOf(key) === -1 &&
      argv[key] !== false &&
      argv[key] !== undefined
    ) {
      if (!argvContains(argvArray, option)) {
        return;
      }

      result.push(option);

      if (typeof argv[key] !== 'boolean') {
        result.push(argv[key]);
      }
    }
  });

  return result;
}
