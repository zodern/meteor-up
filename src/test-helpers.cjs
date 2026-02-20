const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function createSSHOptions(server) {
  const sshAgent = process.env.SSH_AUTH_SOCK;
  const ssh = {
    host: server.host,
    port: (server.opts && server.opts.port) || 22,
    username: server.username
  };

  if (server.pem) {
    ssh.privateKey = fs.readFileSync(path.resolve(server.pem), 'utf8');
  } else if (server.password) {
    ssh.password = server.password;
  } else if (sshAgent && fs.existsSync(sshAgent)) {
    ssh.agent = sshAgent;
  }

  return ssh;
}

function runSSHCommand(info, command) {
  return new Promise((resolve, reject) => {
    const ssh = createSSHOptions(info);
    const conn = new Client();

    conn.connect(ssh);

    conn.once('error', err => {
      if (err) {
        reject(err);
      }
    });

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

function countOccurrences(needle, haystack) {
  const regex = new RegExp(needle, 'g');
  const match = haystack.match(regex) || [];

  return match.length;
}

module.exports = {
  countOccurrences,
  runSSHCommand
};
