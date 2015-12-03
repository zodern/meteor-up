import modules from './modules/';
import MupAPI from './mup-api';
import checkUpdates from './updates';

const args = process.argv.slice(2);
const firstArg = args[0];

let module = modules['default'];
if (modules[firstArg]) {
  module = modules[firstArg];
  args.splice(0, 1);
}

const command = args.shift();

if (!command) {
  module.help(args);
  process.exit(0);
}

if (!module[command]) {
  console.error('error: unknown command %s', command);
  module.help(args);
  process.exit(1);
}

checkUpdates().then(() => {
  const base = process.cwd();
  const api = new MupAPI(base, args);
  module[command](api);
});
