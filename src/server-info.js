import { runSSHCommand } from './utils';

export const _collectors = {
  swarm: {
    command: 'docker info --format \'{{json .Swarm}}\'',
    parser(stdout, code) {
      if (code === 0) {
        return JSON.parse(stdout);
      }
    }
  }
};

const prefix = '<============mup-var-start========';
const suffix = '================mup-var-stop=====>';
const codeSeperator = 'mup-var-code=======';

function generateVarCommand(name, command) {
  return `
  echo "${prefix}${name}${suffix}"
  ${command} 2>&1  
  echo "${codeSeperator}"
  echo $?
  `;
}

function generateScript() {
  let script = '';
  Object.keys(_collectors).forEach(key => {
    const collector = _collectors[key];
    script += generateVarCommand(key, collector.command);
  });
  return script;
}

export function seperateCollectors(output) {
  let collectors = output.split(prefix);
  collectors.shift();

  return collectors.map(collectorOutput => {
    let name = collectorOutput.split(suffix)[0];
    let commandOutput = collectorOutput
      .split(suffix)[1]
      .split(codeSeperator)[0];
    return {
      name: name.trim(),
      output: commandOutput.trim(),
      code: parseInt(collectorOutput.split(codeSeperator)[1].trim(), 10)
    };
  });
}

export function parseCollectorOutput(name, output, code) {
  return _collectors[name].parser(output, code);
}

export function createHostResult(collectorData, host) {
  let result = {_host: host};

  collectorData.forEach(data => {
    result[data.name] = parseCollectorOutput(data.name, data.output, data.code);
  });
  return result;
}

export function getServerInfo(vars, server) {
  let command = generateScript();

  return runSSHCommand(server, command)
    .then(result => {
      let collectorData = seperateCollectors(result.output);
      let hostResult = createHostResult(collectorData, server.host);

      return hostResult;
    })
    .catch(console.log);
}

export default function serverInfo(vars, servers) {
  return Promise.all(
    servers.map(server => getServerInfo(vars, server))
  ).then(serverResults => {
    let result = {};
    serverResults.forEach(serverResult => {
      result[serverResult._host] = serverResult;
    });

    return result;
  });
}
