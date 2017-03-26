import checkUpdates from './updates';
import modules, { addModuleCommands } from './modules/';
import pkg from '../package.json';
// import program from 'commander';
import yargs from 'yargs';
import chalk from 'chalk';

let settingsPath;
let configPath;
const args = process.argv.slice(2);

let program = yargs
  .usage(`\nUsage: ${chalk.yellow('mup')} <command> [args]`)
  .version(pkg.version)
  .alias('version', 'V')
  .global('version', false)
  .option('settings <file path>', {
    description: 'Path to Meteor settings file',
    requiresArg: true,
    string: true
  })
  .option('config <file path>', {
    description: 'Path to mup.js config file',
    requiresArg: true,
    string: true
  })
  .option('verbose', {
    description: 'Print output from build and server scripts',
    boolean: true
  })
  .strict(true)
  .alias('help', 'h')
  .epilogue('for more information, read the docs at https://github.com/zodern/meteor-up')
  .help('help');

addModuleCommands(program);

program = program.argv;

// .action(argAction)
// .option('--settings <filePath>', 'Meteor settings file', setSettingsPath)
// .option('--config <filePath>', 'mup.js config file', setConfigPath)
// .option(
// '--verbose',
// 'Print output during build and executing scripts'
// )
// .on('--help', function() {
//   console.log('   Commands:');

//   function listModuleCommands(commands) {
//     Object.keys(commands).forEach(command => {
//       if (command === 'default') {
//         listModuleCommands(commands['default']);
//         return;
//       }
//       console.log(`     ${command}`);
//     });
//   }

//   listModuleCommands(modules);

//   console.log('');
//   console.log('    For list of subcommands, run ');
//   console.log('      mup <command> help');
// })
// .parse(process.argv);
// if (program.args.length === 0) {
//   program.help();
//   process.exit(0);
// }

function argAction(arg, subarg) {
  let moduleArg = arg;
  let command = subarg;

  if (!command && !modules[moduleArg]) {
    command = moduleArg;
    moduleArg = 'default';
  }

  if (moduleArg === 'default' && command === 'help') {
    program.help();
    process.exit();
  }

  let module;

  if (modules[moduleArg]) {
    module = modules[moduleArg];
  } else {
    console.error(`No such module ${moduleArg}`);
    program.help();
    process.exit(1);
  }

  if (!command) {
    if (moduleArg === 'default') {
      program.help();
    } else {
      module.help(args);
    }
    process.exit(0);
  }

  if (!module[command]) {
    console.error('error: unknown command %s', command);
    if (moduleArg === 'default') {
      program.help();
      process.exit(1);
    }

    module.help(args);
    process.exit(1);
  }

  if (program.settings) {
    let settingsIndex = argIndex(args, '--settings');

    if (args[settingsIndex].indexOf('--settings=') === 0) {
      args.splice(settingsIndex, 1);
    } else {
      args.splice(settingsIndex, 2);
    }
  }

  if (program.config) {
    let configIndex = argIndex(args, '--config');

    if (args[configIndex].indexOf('--config=') === 0) {
      args.splice(configIndex, 1);
    } else {
      args.splice(configIndex, 2);
    }
  }

  checkUpdates().then(() => {
    const base = process.cwd();
    const api = new MupAPI(
      base,
      args,
      configPath,
      settingsPath,
      program.verbose
    );
    let potentialPromise = module[command](api);
    if (potentialPromise && typeof potentialPromise.then === 'function') {
      potentialPromise.catch(e => {
        if (e.nodemiralHistory instanceof Array) {
          // Error is from nodemiral when running a task list
          // Nodemiral already displayed the error to the user
          return;
        }

        console.log(e);
      });
    }
  });
}

function argIndex(list, string) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].indexOf(string) === 0) {
      return i;
    }
  }
  return -1;
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
