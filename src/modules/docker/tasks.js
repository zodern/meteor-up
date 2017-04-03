import debug from 'debug';
import nodemiral from 'nodemiral';
import { resolvePath } from '../utils';
import { runTaskList } from '../utils';
import { each } from 'async';
import chalk from 'chalk';
import { getSessions, getArgs } from '../../mup-api';
import { argv } from 'yargs';

const log = debug('mup:module:docker');

function uniqueSessions() {
  const sessions = getSessions(['meteor', 'mongo', 'proxy']);
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

export function setup() {
  log('exec => mup docker setup');
  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('Setup Docker', {
    script: resolvePath(__dirname, 'assets/docker-setup.sh')
  });

  const sessions = uniqueSessions();
  return runTaskList(list, sessions, { verbose: argv.verbose });
}

export function restart() {
  const list = nodemiral.taskList('Restart Docker Daemon');

  list.executeScript('Restart Docker', {
    script: resolvePath(__dirname, 'assets/docker-restart.sh')
  });

  const sessions = uniqueSessions();

  return runTaskList(list, sessions, { verbose: argv.verbose });
}

export function ps() {
  let args = getArgs();
  args.shift();
  each(uniqueSessions(), (session, cb) => {
    session.execute(`sudo docker ${args.join(' ')} 2>&1`, (err, code, logs) => {
      console.log(chalk.magenta(`[${session._host}]`) + chalk.blue(` docker ${args.join(' ')}`));
      console.log(logs.stdout);
      cb();
    });
  });
}
