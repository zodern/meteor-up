import DigitalOcean from './digital-ocean';
import { waitForServers } from './utils';

function createSourceConfig(SourceAPI) {
  return {
    async load({ name, groupConfig }, pluginApi) {
      const api = new SourceAPI(name, groupConfig, pluginApi);

      return api.getServers();
    },
    async upToDate({ name, groupConfig, list }, pluginApi) {
      const api = new SourceAPI(name, groupConfig, pluginApi);
      const { wrong, good, toResize = [] } = await api.compareServers(list);

      return wrong.length === 0 &&
        good.length === groupConfig.count &&
        toResize.length === 0;
    },
    async update({ name, groupConfig }, pluginApi) {
      const api = new SourceAPI(name, groupConfig, pluginApi);
      const { wrong, good, toResize = [] } = await api.compareServers();

      const addCount = Math.max(0, groupConfig.count - good.length);
      const goodRemoveCount = Math.max(0, good.length - groupConfig.count);

      if (goodRemoveCount > 0) {
        console.log(`=> Removing ${goodRemoveCount} servers for ${name}`);
        await api.removeServers(good.slice(0, goodRemoveCount));
        console.log(`=> Finished removing ${goodRemoveCount} servers for ${name}`);
      }
      if (wrong.length > 0) {
        // TODO: don't delete tempCount until mup successfully exits
        console.log(`=> Removing ${wrong.length} servers for ${name}`);
        await api.removeServers(wrong);
        console.log(`=> Finished removing ${wrong.length} servers for ${name}`);
      }
      if (addCount > 0) {
        console.log(`=> Creating ${addCount} servers for ${name}`);
        const created = await api.createServers(addCount);
        await waitForServers(created, pluginApi);
        console.log(`=> Finished creating ${addCount} servers for ${name}`);
      }

      for (const server of toResize) {
        console.log(`=> Resizing ${server.__droplet.name} for ${name}`);
        await api.resizeServer(server.__droplet.id);
        await waitForServers([server], pluginApi);
        console.log(`=> Finished resizing ${server.__droplet.name} for ${name}`);
      }
    }
  };
}

const serverSources = {
  'digital-ocean': createSourceConfig(DigitalOcean)
};

export default serverSources;
