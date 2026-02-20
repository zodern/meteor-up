export default class ConfigLoader {
  constructor(configPath) {
    this.configPath = configPath;
    this.loadError = null;
    this.loaded = false;
    this.config = null;
  }

  async loadConfig() {
    try {
      const configModule = await import(this.configPath);
      this.config = configModule.default;
    } catch (error) {
      this.loadError = error;

      return false;
    } finally {
      this.loaded = true;
    }

    return true;
  }

  getConfig() {
    if (!this.loaded) {
      throw new Error('Config has not been loaded');
    }

    return this.config;
  }
}
