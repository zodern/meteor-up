// Registers additional nodemiral tasks
import nodemiral from 'nodemiral';
import { clone, merge } from 'lodash';

function copy(session, _options, callback) {
  const options = clone(_options);
  let retries = 0;

  if (typeof options.hostVars === 'object' && options.hostVars[session._host]) {
    options.vars = merge(options.vars, options.hostVars[session._host]);
  }

  function doCopy() {
    session.copy(options.src, options.dest, options, cb);
  }
  function cb(err) {
    if (err && retries < 3) {
      console.log('Failed to copy file ', err);
      console.log('Retrying in 3 seconds');

      setTimeout(doCopy, 3000);
      return;
    }
    callback(err);
  }

  doCopy();
}

nodemiral.registerTask('copy', copy);
