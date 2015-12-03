import path from 'path';
import sh from 'shelljs';
sh.config.silent = true;

export default {
  deploy(args) {
    console.log('TODO: default deploy', args);
  },

  help(args) {
    console.log('TODO: default help', args);
  },

  init(args) {
    // TODO check if mup.js or settings.json files exists
    const src = path.resolve(__dirname, '../../template/*');
    const dst = process.cwd();
    sh.cp(src, dst);
  },

  logs(args) {
    console.log('TODO: default deploy', args);
  },

  reconfig(args) {
    console.log('TODO: default reconfig', args);
  },

  restart(args) {
    console.log('TODO: default restart', args);
  },

  setup(args) {
    console.log('TODO: default setup', args);
  },

  start(args) {
    console.log('TODO: default start', args);
  },

  stop(args) {
    console.log('TODO: default stop', args);
  },
};
