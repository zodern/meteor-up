import path from 'path';
import debug from 'debug';
import nodemiral from 'nodemiral';
import {runTaskList} from '../utils';
const log = debug('mup:module:docker');

export function help(/* api */) {
  log('exec => mup docker help');
}

export function setup(api) {
  log('exec => mup docker setup');
  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('setup docker', {
    script: path.resolve(__dirname, 'assets/docker-setup.sh')
  });

  const sessions = api.getSessions([ 'meteor', 'mongo', 'proxy' ]);
  return runTaskList(list, sessions);
}
