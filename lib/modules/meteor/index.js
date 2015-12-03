import path from 'path';
import nodemiral from 'nodemiral';

// export function deploy(api) {
//
// }

// export function help(api) {
//
// }

// export function logs(api) {
//
// }

// export function reconfig(api) {
//
// }

// export function restart(api) {
//
// }

export function setup(api) {
  const config = api.getConfig().meteor;
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

  const sessions = api.getSessions([ 'meteor' ]);
  taskList.run(sessions);
}

// export function start(api) {
//
// }

// export function stop(api) {
//
// }
