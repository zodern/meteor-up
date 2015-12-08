import path from 'path';
import nodemiral from 'nodemiral';
import {runTaskList} from '../utils';

export function help(/* api */) {
  console.log('TODO: mup docker help');
}

export function setup(api) {
  const list = nodemiral.taskList('Setup Docker');

  list.executeScript('setup docker', {
    script: path.resolve(__dirname, 'assets/docker-setup.sh')
  });

  const sessions = api.getSessions([ 'meteor', 'mongo', 'proxy' ]);
  return runTaskList(list, sessions);
}
