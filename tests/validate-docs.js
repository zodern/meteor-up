import codeBlocks from 'gfm-code-blocks';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import sh from 'shelljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const docsPath = path.resolve(__dirname, '../docs/docs.md');
const tmpPath = path.resolve(__dirname, './validate-tmp');
const tmpConfig = path.resolve(__dirname, './validate-tmp/mup.cjs');

const docs = fs.readFileSync(docsPath).toString().split('## Creating a plugin')[0];

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

process.env.MUP_SKIP_UPDATE_CHECK = 'true';

for (const config of validConfigs) {
  fs.writeFileSync(tmpConfig, config.code);

  const configModule = await import(`${tmpConfig}?t=${Date.now()}`);
  const configObject = configModule.default;

  configObject.servers = configObject.servers || servers;

  fs.writeFileSync(tmpConfig, `module.exports = ${JSON.stringify(configObject, null, 2)}`);
  sh.cd(tmpPath);
  const out = sh.exec(`node ../../index.js validate --config ${tmpConfig}`);

  if (out.code > 0) {
    console.dir(configObject);
    console.log(`Example starts at character ${config.start}`);
    failed += 1;
  } else {
    success += 1;
  }
}

console.log(`${success - failed}/${success} configs are valid`);

if (failed > 0) {
  process.exitCode = 1;
}
