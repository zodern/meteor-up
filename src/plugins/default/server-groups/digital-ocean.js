import axios from 'axios';
import { generateName, createFingerprint } from './utils';
import fs from 'fs';

export default class DigitalOcean {
  constructor(groupName, groupConfig, pluginApi) {
    this.name = groupName;
    this.config = groupConfig;

    this.publicKeyPath = pluginApi.resolvePath(this.config.sshKey.public);

    this.tag = groupConfig.__tag || `mup-${this.name}`;
  }

  async getServers(ids) {
    // TODO: implement pagination
    const results = await this._request(
      'get',
      `droplets?tag_name=${this.tag}&per_page=200`
    );

    return results.data.droplets.map(droplet => ({
      name: droplet.name,
      host: droplet.networks.v4.find(n => n.type === 'public').ip_address,
      username: 'root',
      pem: this.config.sshKey.private,
      privateIp: droplet.networks.v4.find(n => n.type === 'private').ip_address,
      __droplet: droplet
    })).filter(server => {
      if (ids) {
        return ids.includes(server.__droplet.id);
      }

      return true;
    });
  }

  async compareServers(servers) {
    if (!servers) {
      // eslint-disable-next-line no-param-reassign
      servers = await this.getServers();
    }

    const good = [];
    const wrong = [];
    const toResize = [];

    servers.forEach(server => {
      const droplet = server.__droplet;

      if (droplet.region.slug !== this.config.region) {
        wrong.push(server);

        return;
      }

      if (
        droplet.size_slug !== this.config.size
      ) {
        if (this.config._resize) {
          toResize.push(server);
        } else {
          wrong.push(server);
        }

        return;
      }

      good.push(server);
    });

    return {
      wrong,
      good,
      toResize
    };
  }

  async removeServers(servers) {
    const promises = servers.map(server => this._request(
      'delete',
      `droplets/${server.__droplet.id}`
    ));

    await Promise.all(promises);
  }

  async createServers(count) {
    let fingerprint = await this._setupPublicKey();
    const names = [];

    let size = this.config.size;
    if (this.config._resize) {
      size = this.config._resize.initialSize;
    }

    while (names.length < count) {
      names.push(generateName(this.name));
    }

    const data = {
      names,
      region: this.config.region,
      size,

      // TODO: pick image from API
      image: 'ubuntu-20-04-x64',

      // eslint-disable-next-line camelcase
      ssh_keys: [
        fingerprint
      ],
      monitoring: true,
      tags: [
        this.tag
      ]
    };

    const result = await this._request(
      'post',
      'droplets',
      data,
    );

    const ids = result.data.droplets.map(droplet => droplet.id);
    await Promise.all(ids.map(id => this._waitForStatus(id, 'active')));

    if (size !== this.config.size) {
      await Promise.all(ids.map(id => this.resizeServer(id, this.config.size)));
    }

    return this.getServers(ids);
  }

  async _setupPublicKey() {
    let content = fs.readFileSync(this.publicKeyPath, 'utf-8');
    let fingerprint = createFingerprint(content);

    try {
      await this._request(
        'get',
        `account/keys/${fingerprint}`
      );

      return fingerprint;
    } catch (e) {
      if (!e || !e.response || !e.response.status === 404) {
        console.dir(e);

        throw e;
      }

      // Key doesn't exist. Ignore error since we will be adding it
    }

    try {
      await this._request(
        'post',
        'account/keys',
        {
          // eslint-disable-next-line camelcase
          public_key: content,
          name: this.config.sshKey.name || this.name
        }
      );
    } catch (e) {
      console.dir(e);
      throw e;
    }

    return fingerprint;
  }

  // Default timeout is 10 minutes
  async _waitForStatus(dropletId, desiredStatus, timeout = 1000 * 60 * 10) {
    const timeoutAt = Date.now() + timeout;

    while (Date.now() < timeoutAt) {
      const response = await this._request(
        'get',
        `droplets/${dropletId}`
      );
      const status = response.data.droplet.status;

      if (status === desiredStatus) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * 10));
    }

    throw new Error(`Timed out waiting for droplet ${dropletId} to become active`);
  }

  async resizeServer(dropletId) {
    await this._shutdownDroplet(dropletId);

    const result = await this._request(
      'post',
      `droplets/${dropletId}/actions`,
      {
        type: 'resize',
        disk: false,
        size: this.config.size
      }
    );

    const actionId = result.data.action.id;

    let timeoutAt = Date.now() + (1000 * 60 * 10);
    while (Date.now() < timeoutAt) {
      const { data } = await this._request(
        'get',
        `droplets/${dropletId}/actions/${actionId}`
      );

      if (data.action.status === 'completed') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * 10));
    }

    await this._request(
      'post',
      `droplets/${dropletId}/actions`,
      {
        type: 'power_on'
      }
    );

    await this._waitForStatus(dropletId, 'active');
  }

  async _shutdownDroplet(dropletId) {
    await this._request(
      'post',
      `droplets/${dropletId}/actions`,
      {
        type: 'shutdown'
      }
    );

    try {
      await this._waitForStatus(dropletId, 'off', 1000 * 60 * 3);
    } catch (e) {
      console.log(e);
      await this._request(
        'post',
        `droplets/${dropletId}/actions`,
        {
          type: 'power_off'
        }
      );
      await this._waitForStatus(dropletId, 'off');
    }
  }

  _request(method, path, data) {
    return axios({
      method,
      url: `https://api.digitalocean.com/v2/${path}`,
      data,
      headers: {
        Authorization: `Bearer ${this.config.token}`
      }
    }).catch(err => {
      if (err.config && err.config.headers) {
        err.config.headers.Authorization = '<redacted>';
      }

      throw err;
    });
  }
}
