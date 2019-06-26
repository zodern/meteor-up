import { clone, merge } from 'lodash';
import nodemiral from '@zodern/nodemiral';

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
    // Check if common error that a known fix
    if (err) {
      if (err.message === 'No such file') {
        err.solution = 'Please run "mup setup" to create missing folders on the server.';

        // Skip retries since we will have the same error
        retries = 10;
      }
    }

    retries += 1;

    if (err && retries < 4) {
      const timeout = retries * 3000;

      console.log('Failed to copy file ', err.message);
      console.log(`Retrying in ${timeout / 1000} seconds`);

      setTimeout(doCopy, timeout);

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

  session.executeScript(
    options.script,
    options,
    createCallback(callback, varsMapper)
  );
}

function createCallback(cb, varsMapper) {
  return function(err, code, logs = {}) {
    logs.stderr = logs.stderr || '';
    logs.stdout = logs.stdout || '';

    if (err) {
      return cb(err);
    }
    if (code > 0) {
      const message = `
      ------------------------------------STDERR------------------------------------
      ${logs.stderr.substring(logs.stderr.length - 4200)}
      ------------------------------------STDOUT------------------------------------
      ${logs.stdout.substring(logs.stdout.length - 4200)}
      ------------------------------------------------------------------------------
      `;

      return cb(new Error(message));
    }

    if (varsMapper) {
      varsMapper(logs.stdout, logs.stderr);
    }

    cb();
  };
}

nodemiral.registerTask('copy', copy);
nodemiral.registerTask('executeScript', executeScript);

const oldApplyTemplate = nodemiral.session.prototype._applyTemplate;
// Adds support for using include with ejs
nodemiral.session.prototype._applyTemplate = function(file, vars, callback) {
  const ejsOptions = this._options.ejs || {};

  this._options.ejs = {
    ...ejsOptions,
    filename: file
  };
  oldApplyTemplate.call(this, file, vars, (...args) => {
    this._options.ejs = ejsOptions;
    callback(...args);
  });
};
