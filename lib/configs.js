import path from 'path';

// load mup files from cwd
const base = process.cwd();

export const mup = require(path.join(base, 'mup.js')).default;
export const settings = require(path.join(base, 'settings.json'));
