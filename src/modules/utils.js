import * as _ from 'underscore';

import { Client } from 'ssh2';
import debug from 'debug';
import expandTilde from 'expand-tilde';
import fs from 'fs';
import path from 'path';
import { promisify } from 'bluebird';
import stream from 'stream';
import readline from 'readline';

const log = debug('mup:utils');

function addStdioHandlers(list) {
  list._taskQueue = list._taskQueue.map(task => {
    task.options.onStdout = () => {
      return data => {
        process.stdout.write(data);
      };
    };
    task.options.onStderr = () => {
      return data => {
        process.stderr.write(data);
      };
    };
    return task;
  });
}

export function runTaskList(list, sessions, opts) {
  if (opts && opts.verbose) {
    addStdioHandlers(list);
    delete opts.verbose;
  }
  return new Promise((resolve, reject) => {
    list.run(sessions, opts, summaryMap => {
      for (var host in summaryMap) {
        if (summaryMap.hasOwnProperty(host)) {
          const summary = summaryMap[host];
          if (summary.error) {
            let error = summary.error;
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

// Implments a simple readable stream to pass
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
      let shouldContinue = this.reading && this.push(this.data.shift());
      if (!shouldContinue) {
        this.reading = false;
      }
    });
  }
}

export function getDockerLogs(name, sessions, args) {
  const command = 'sudo docker ' + args.join(' ') + ' ' + name + ' 2>&1';

  log(`getDockerLogs command: ${command}`);

  let promises = _.map(sessions, session => {
    const input = new Callback2Stream();
    const host = '[' + session._host + ']';
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

// Maybe we should create a new npm package
// for this one. Something like 'sshelljs'.
export function runSSHCommand(info, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    // TODO better if we can extract SSH agent info from original session
    var sshAgent = process.env.SSH_AUTH_SOCK;
    var ssh = {
      host: info.host,
      port: (info.opts && info.opts.port) || 22,
      username: info.username
    };

    if (info.pem) {
      ssh.privateKey = fs.readFileSync(resolvePath(info.pem), 'utf8');
    } else if (info.password) {
      ssh.password = info.password;
    } else if (sshAgent && fs.existsSync(sshAgent)) {
      ssh.agent = sshAgent;
    }
    conn.connect(ssh);

    conn.once('error', function(err) {
      if (err) {
        reject(err);
      }
    });

    // TODO handle error events
    conn.once('ready', function() {
      conn.exec(command, function(err, outputStream) {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        let output = '';

        outputStream.on('data', function(data) {
          output += data;
        });

        outputStream.once('close', function(code) {
          conn.end();
          resolve({ code, output });
        });
      });
    });
  });
}

export function countOccurences(needle, haystack) {
  const regex = new RegExp(needle, 'g');
  const match = haystack.match(regex) || [];
  return match.length;
}

export function resolvePath(...paths) {
  let expandedPaths = paths.map(_path => {
    return expandTilde(_path);
  });
  return path.resolve(...expandedPaths);
}
