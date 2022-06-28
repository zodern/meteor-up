import crypto from 'crypto';
import { Client } from 'ssh2-classic';

export function generateName(groupName) {
  const randomString = crypto.randomBytes(4).toString('hex');

  return `${groupName}-${randomString}`;
}

export function createFingerprint(keyContent) {
  const cleanedContent = keyContent
    // Remove key type at beginning
    .replace(/(^ssh-[a-zA-Z0-9]*)/, '')
    .trim()
    // Remove comment at end
    .replace(/ [^ ]+$/, '');

  const buffer = Buffer.from(cleanedContent, 'base64');
  const hash = crypto.createHash('md5').update(buffer).digest('hex');

  // Add colons between every 2 characters
  return hash.match(/.{1,2}/g).join(':');
}

const FIVE_MINUTES = 1000 * 60 * 5;
export function waitForServers(servers, api) {
  async function waitForServer(server, startTime = Date.now()) {
    if (Date.now() - startTime > FIVE_MINUTES) {
      throw new Error('Timed out waiting for server to accept SSH connections');
    }

    try {
      await new Promise((resolve, reject) => {
        const ssh = api._createSSHOptions(server);
        const conn = new Client();
        conn.once('error', err => {
          reject(err);
        }).once('ready', () => {
          conn.end();
          resolve();
        }).connect(ssh);
      });
    } catch (e) {
      if (e.code !== 'ECONNREFUSED') {
        console.dir(e);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * 5));

      return waitForServer(server);
    }
  }

  return Promise.all(
    servers.map(server => waitForServer(server))
  );
}
