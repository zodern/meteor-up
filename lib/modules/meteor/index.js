import path from 'path';
import debug from 'debug';
import nodemiral from 'nodemiral';
import uuid from 'uuid';
import * as _ from 'underscore';
import {promisify} from 'bluebird';
import {runTaskList} from '../utils';
import buildApp from './build.js';
import * as docker from '../docker/';
const log = debug('mup:module:meteor');


export function help(/* api */) {
  log('exec => mup meteor help');
}

export function logs(api) {
  log('exec => mup meteor logs');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const args = api.getArgs();
  const sessions = api.getSessions([ 'meteor' ]);
  const command = 'sudo docker logs ' + args.join(' ') + ' ' + config.name;

  var promises = _.map(sessions, session => {
    var host = '[' + session._host + ']';
    var options = {
      onStdout: data => {
        process.stdout.write(host + data);
      },
      onStderr: data => {
        process.stdout.write(host + data);
      }
    };
    return promisify(session.execute.bind(session))(command, options);
  });
  return Promise.all(promises);
}

export function setup(api) {
  log('exec => mup meteor setup');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Setup Meteor');

  list.executeScript('Setup Environment', {
    script: path.resolve(__dirname, 'assets/meteor-setup.sh'),
    vars: {
      name: config.name,
    },
  });

  if (config.ssl) {
    list.copy('Copying SSL Certificate Bundle', {
      src: config.ssl.crt,
      dest: '/opt/' + config.name + '/config/bundle.crt'
    });

    list.copy('Copying SSL Private Key', {
      src: config.ssl.key,
      dest: '/opt/' + config.name + '/config/private.key'
    });

    list.executeScript('Verifying SSL Configurations', {
      script: path.resolve(__dirname, 'assets/verify-ssl-config.sh'),
      vars: {
        name: config.name
      },
    });
  }

  const sessions = api.getSessions([ 'meteor' ]);
  const apiForMeteor = api.withSessions([ 'meteor' ]);

  return docker.setup(apiForMeteor)
    .then(() => runTaskList(list, sessions));
}

export function push(api) {
  log('exec => mup meteor push');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  console.log('Bulding App Bundle Locally');
  var buildLocation = path.resolve('/tmp', uuid.v4());
  var bundlePath = path.resolve(buildLocation, 'bundle.tar.gz');

  return buildApp(config.path, buildLocation, config.buildOptions || {})
    .then(() => {
      const list = nodemiral.taskList('Pushing Meteor');

      list.copy('Pushing Meteor App Bundle to The Server', {
        src: bundlePath,
        dest: '/opt/' + config.name + '/tmp/bundle.tar.gz',
        progressBar: config.enableUploadProgressBar
      });

      list.copy('Pushing the Startup Script', {
        src: path.resolve(__dirname, 'assets/templates/start.sh'),
        dest: '/opt/' + config.name + '/config/start.sh',
        vars: {
          appName: config.name,
          useLocalMongo: config.setupMongo,
          port: config.env.PORT || 80,
          sslConfig: config.ssl
        }
      });

      const sessions = api.getSessions([ 'meteor' ]);
      return runTaskList(list, sessions);
    });
}

export function envconfig(api) {
  log('exec => mup meteor envconfig');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Configuring  Meteor Environment Variables');

  var env = _.clone(config.env);
  // sending PORT to the docker container is useless.
  // It'll run on PORT 80 and we can't override it
  // Changing the port is done via the start.sh script
  delete env.PORT;

  list.copy('Sending Environment Variables', {
    src: path.resolve(__dirname, 'assets/templates/env.list'),
    dest: '/opt/' + config.name + '/config/env.list',
    vars: {
      env: env || {},
      appName: config.name
    }
  });
  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}

export function start(api) {
  log('exec => mup meteor start');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Start Meteor');

  list.executeScript('Start Meteor', {
    script: path.resolve(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: config.name
    }
  });

  list.executeScript('Verifying Deployment', {
    script: path.resolve(__dirname, 'assets/meteor-deploy-check.sh'),
    vars: {
      deployCheckWaitTime: config.deployCheckWaitTime || 10,
      appName: config.name,
      port: config.port
    }
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}

export function deploy(api) {
  log('exec => mup meteor deploy');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  return push(api)
    .then(() => envconfig(api))
    .then(() => start(api));
}

export function stop(api) {
  log('exec => mup meteor stop');
  const config = api.getConfig().meteor;
  if (!config) {
    console.error('error: no configs found for meteor');
    process.exit(1);
  }

  const list = nodemiral.taskList('Stop Meteor');

  list.executeScript('Stop Meteor', {
    script: path.resolve(__dirname, 'assets/meteor-stop.sh'),
    vars: {
      appName: config.name
    }
  });

  const sessions = api.getSessions([ 'meteor' ]);
  return runTaskList(list, sessions);
}
