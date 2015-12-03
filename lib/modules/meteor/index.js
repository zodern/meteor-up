import path from 'path';
import nodemiral from 'nodemiral';
import {getConfig} from '../../configs';
import {getSessions} from '../../sessions';

export default {
  deploy(args) {
    console.log('TODO: meteor deploy', args);
  },

  help(args) {
    console.log('TODO: meteor help', args);
  },

  logs(args) {
    console.log('TODO: meteor deploy', args);
  },

  reconfig(args) {
    console.log('TODO: meteor reconfig', args);
  },

  restart(args) {
    console.log('TODO: meteor restart', args);
  },

  setup(args) {
    const config = getConfig().mup.meteor;
    if (!config) {
      console.error('error: no configs found for meteor');
      process.exit(1);
    }

    const taskList = nodemiral.taskList('Setup Meteor');

    taskList.executeScript('checking requirements', {
      script: path.resolve(__dirname, 'assets/validate-server.sh')
    });

    taskList.executeScript('installing docker', {
      script: path.resolve(__dirname, 'assets/install-docker.sh')
    });

    taskList.executeScript('setting up environment', {
      script: path.resolve(__dirname, 'assets/setup-environment.sh'),
      vars: {
        name: config.name
      }
    });

    if (config.ssl) {
      taskList.copy('copying ssl certificate bundle', {
        src: config.ssl.crt,
        dest: '/opt/' + config.name + '/config/bundle.crt'
      });

      taskList.copy('copying ssl private key', {
        src: config.ssl.key,
        dest: '/opt/' + config.name + '/config/private.key'
      });

      taskList.executeScript('verifying ssl configurations', {
        script: path.resolve(__dirname, 'assets/verify-ssl-config.sh'),
        vars: {
          name: config.name
        }
      });
    }

    const sessions = getSessions(['meteor']);
    taskList.run(sessions);
  },

  start(args) {
    console.log('TODO: meteor start', args);
  },

  stop(args) {
    console.log('TODO: meteor stop', args);
  },
};
