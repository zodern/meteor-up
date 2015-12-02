import path from 'path';
import sh from 'shelljs';
sh.config.silent = true;

export default {
  async deploy(args) {
    console.log('TODO: default deploy', args);
  },

  async help(args) {
    console.log('TODO: default help', args);
  },

  async init(args) {
    // TODO check if mup.js or settings.json files exists
    const src = path.resolve(__dirname, '../../template/*');
    const dst = process.cwd();
    sh.cp(src, dst);
  },

  async logs(args) {
    console.log('TODO: default deploy', args);
  },

  async reconfig(args) {
    console.log('TODO: default reconfig', args);
  },

  async restart(args) {
    console.log('TODO: default restart', args);
  },

  async setup(args) {
    console.log('TODO: default setup', args);
  },

  async start(args) {
    console.log('TODO: default start', args);
  },

  async stop(args) {
    console.log('TODO: default stop', args);
  },
};
