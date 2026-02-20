export default class ConfigLoader {
  constructor(configPath) {
    this.configPath = configPath;
    this.loadError = null;
    this.loaded = false;
    this._config = {};
  }

  async loadConfig() {
    try {
      const configModule = await import(this.configPath);
      this._config = configModule.default;
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

    return this._config;
  }
}
