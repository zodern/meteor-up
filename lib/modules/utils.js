import fs from 'fs';
import sh from 'shelljs';
import {Client} from 'ssh2';

export function runTaskList(list, sessions) {
  return new Promise((resolve, reject) => {
    list.run(sessions, summaryMap => {
      for (var host in summaryMap) {
        const summary = summaryMap[host];
        if (summary.error) {
          reject(summary.error);
          return;
        }
      }

      resolve();
    });
  });
}

// Maybe we should create a new npm package
// for this one. Something like 'sshelljs'.
export function runSSHCommand(info, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    // TODO handle password based authentication
    conn.connect({
      host: info.host,
      port: (info.opts && info.opts.port || 22),
      username: info.user,
      privateKey: fs.readFileSync(info.pem)
    });

    conn.once('error', function (err) {
      if (err) {
        reject(err);
      }
    });

    // TODO handle error events
    conn.once('ready', function () {
      conn.exec(command, function(err, stream) {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        let output = '';

        stream.on('data', function (data) {
          output += data;
        });

        stream.once('close', function (code) {
          conn.end();
          resolve({code, output});
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
