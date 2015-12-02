import path from 'path';

let ready = false;
const config = {};

export function getConfig() {
  if (!ready) {
    loadConfig();
    ready = true;
  }

  return config;
}

function loadConfig() {
  const base = process.cwd();
  config.mup = require(path.join(base, 'mup.js'));
  config.settings = require(path.join(base, 'settings.json'));
}
