import {argv} from 'yargs';
import MupAPI from '../mup-api';

export default function(handler) {
  return function() {
    const api = new MupAPI(
      process.cwd(),
      process.argv.slice(2),
      argv.config,
      argv['settings <file path>'],
      argv['config <file path>'],
      argv.verbose
    );
    handler(api);
  };
}
