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

function executeScript(session, _options, callback, varsMapper) {
  const options = clone(_options);
  if (typeof options.hostVars === 'object' && options.hostVars[session._host]) {
    options.vars = merge(options.vars, options.hostVars[session._host]);
  }

  session.executeScript(options.script, options, createCallback(callback, varsMapper));
}

function createCallback(cb, varsMapper) {
  return function (err, code, logs) {
    logs.stderr = logs.stderr || '';
    logs.stdout = logs.stdout || '';

    if (err) {
      return cb(err);
    }
    if (code > 0) {
      let message = `
      ------------------------------------STDERR------------------------------------
      ${logs.stderr.substring(logs.stderr.length - 2000)}
      ------------------------------------STDOUT------------------------------------
      ${logs.stdout.substring(logs.stdout.length - 2000)}
      ------------------------------------------------------------------------------      
      `
      return callback(new Error(message));
    }

    if (varsMapper) {
      varsMapper(logs.stdout, logs.stderr);
    }

    cb();
  }
}

nodemiral.registerTask('copy', copy);
nodemiral.registerTask('executeScript', executeScript);
