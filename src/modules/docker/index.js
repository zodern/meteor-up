import debug from 'debug';
import nodemiral from 'nodemiral';
import { resolvePath } from '../utils';
import { runTaskList } from '../utils';
import { each } from 'async';
import chalk from 'chalk';
const log = debug('mup:module:docker');

function uniqueSessions(api) {
  const sessions = api.getSessions(['meteor', 'mongo', 'proxy']);
  return sessions.reduce(
    (prev, curr) => {
      if (prev.map(session => session._host).indexOf(curr._host) === -1) {
        prev.push(curr);
      }
      return prev;
    },
    []
  );
}

export function help() {
  log('exec => mup docker help');
}

export function setup(api) {
  log('exec => mup docker setup');
  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('Setup Docker', {
    script: resolvePath(__dirname, 'assets/docker-setup.sh')
  });

  const sessions = uniqueSessions(api);
  return runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function restart(api) {
  const list = nodemiral.taskList('Restart Docker Daemon');

  list.executeScript('Restart Docker', {
    script: resolvePath(__dirname, 'assets/docker-restart.sh')
  });

  const sessions = uniqueSessions(api);

  return runTaskList(list, sessions, { verbose: api.getVerbose() });
}

export function ps(api) {
  let args = api.getArgs();
  args.shift();
  each(uniqueSessions(api), (session, cb) => {
    session.execute(`sudo docker ${args.join(' ')} 2>&1`, (err, code, logs) => {
      console.log(chalk.magenta(`[${session._host}]`) + chalk.blue(` docker ${args.join(' ')}`));
      console.log(logs.stdout);
      cb();
    });
  });
}
