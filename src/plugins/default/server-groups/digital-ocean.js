import axios from 'axios';
import { generateName } from './utils';

export default class DigitalOcean {
  constructor(groupName, groupConfig) {
    this.name = groupName;
    this.config = groupConfig;

    const tagPrefix = groupConfig.__tagPrefix || 'mup-';
    this.tag = `${tagPrefix}-${this.name}`;
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
      pem: this.config.pem,
      privateIp: droplet.networks.v4.find(n => n.type === 'private').ip_address,
      __droplet: droplet
    })).filter(server => {
      if (ids) {
        return ids.includes(server.__droplet.id);
      }

      return true;
    });
  }

  async compareServers() {
    const servers = await this.getServers();
    const good = [];
    const wrong = [];

    servers.forEach(server => {
      const droplet = server.__droplet;

      if (
        droplet.size_slug !== this.config.size ||
        droplet.region.slug !== this.config.region
      ) {
        wrong.push(server);
      } else {
        good.push(server);
      }
    });

    return {
      wrong,
      good
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
    const names = [];

    while (names.length < count) {
      names.push(generateName(this.name));
    }

    const data = {
      names,
      region: this.config.region,
      size: this.config.size,

      // TODO: pick image from API
      image: 'ubuntu-20-04-x64',

      // eslint-disable-next-line camelcase
      ssh_keys: [
        // TODO: Replace the fingerprint in the config with the path to the
        // public key. Then mup can create the fingerprint, and add the ssh key
        // to digital ocean if missing. This would allow each developer to have
        // their own keys as long as during `mup setup` the other public keys
        // are added to the server
        this.config.sshKeyFingerprint
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
    await Promise.all(ids.map(id => this._waitForDropletActive(id)));

    return this.getServers(ids);
  }
  }

  async _waitForDropletActive(id) {
    const TEN_MINUTES = 1000 * 60 * 10;
    const timeoutAt = Date.now() + TEN_MINUTES;

    while (Date.now() < timeoutAt) {
      const response = await this._request(
        'get',
        `droplets/${id}`
      );
      const status = response.data.droplet.status;

      if (status === 'active') {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * 10));
    }

    throw new Error(`Timed out waiting for droplet ${id} to become active`);
  }

  _request(method, path, data) {
    return axios({
      method,
      url: `https://api.digitalocean.com/v2/${path}`,
      data,
      headers: {
        Authorization: `Bearer ${this.config.token}`
      }
    });
  }
}
