import modules from './modules/';
import MupAPI from './mup-api';
import checkUpdates from './updates';
import program from 'commander';

let settingsPath;
let configPath;
const args = process.argv.slice(2);

program
  .arguments('<arg> [subarg]')
  .action(argAction)
  .option('--settings <filePath>', 'Meteor settings file', setSettingsPath)
  .option('--config <filePath>', 'mup.js config file', setConfigPath)
  .parse(process.argv);

function argAction(arg, subarg) {

  let moduleArg = arg;
  let command = subarg;

  if(!command && !modules[moduleArg]) {
    command = moduleArg;
    moduleArg = 'default';
  }

  let module;

  if(modules[moduleArg]) {
    module = modules[moduleArg];
  } else {
    console.error('No such module');
  }

  if(!command) {
    module.help(args);
    process.exit(0);
  }

  if (!module[command]) {
    console.error('error: unknown command %s', command);
    module.help(args);
    process.exit(1);
  }

  if(program.settings) {
    args.splice(0, 2);
  }

  if(program.config) {
    args.splice(0, 2);
  }

  checkUpdates().then(() => {
    const base = process.cwd();
    const api = new MupAPI(base, args, configPath, settingsPath);
    module[command](api);
  });
}

function handleErrors(e) {
  console.log(e.name, e.message);
  process.exit(1);
}

function setSettingsPath(settingsPathArg) {
  settingsPath = settingsPathArg;
}

function setConfigPath(configPathArg) {
  configPath = configPathArg;
}

process.on('uncaughtException', handleErrors);
