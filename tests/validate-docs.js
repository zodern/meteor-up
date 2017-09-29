var codeBlocks = require('gfm-code-blocks');
var fs = require('fs');
var path = require('path');
var sh = require('shelljs');

var docsPath = path.resolve(__dirname, '../docs/docs.md');
var tmpPath = path.resolve(__dirname, './validate-tmp');
var tmpConfig = path.resolve(__dirname, './validate-tmp/mup.js');

var docs = fs.readFileSync(docsPath).toString().split('## Creating a plugin')[0];

const blocks = codeBlocks(docs);
const validConfigs = blocks.filter(block => block.lang === 'js');

try {
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath);
  }
} catch (e) {
  console.log(e);
}

const servers = {
  one: {
    host: '1.1.1.1',
    username: 'test'
  },
  two: {
    host: '1.1.1.1',
    username: 'test'
  }
};

let failed = 0;
let success = 0;

validConfigs.forEach(config => {
  fs.writeFileSync(tmpConfig, config.code);
  delete require.cache[require.resolve(tmpConfig)];
  const configObject = require(tmpConfig); // eslint-disable-line

  configObject.servers = configObject.servers || servers;

  fs.writeFileSync(tmpConfig, 'module.exports = ' + JSON.stringify(configObject));
  sh.cd(tmpPath);
  const out = sh.exec('node ../../index.js validate');

  if (out.code > 0) {
    console.dir(configObject);
    console.log(`Example starts at character ${config.start}`);
    failed += 1;
  } else {
    success += 1;
  }
});

console.log(`${success - failed}/${success} configs are valid`);
