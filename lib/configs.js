import path from 'path';

// load mup files from cwd
const base = process.cwd();

export const meteorUp = require(path.join(base, 'meteorUp.js')).default;
export const settings = require(path.join(base, 'settings.json'));
