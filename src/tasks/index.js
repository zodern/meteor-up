import { resolvePath } from '../utils';
import shellEscape from 'shell-escape';

function escapeEnv(env) {
  if (env instanceof Array) {
    return env.map(_env => {
      _env.value = shellEscape([_env.value]);

      return _env;
    });
  }

  return Object.keys(env).reduce((result, key) => {
    result[key] = shellEscape([env[key]]);

    return result;
  }, {});
}

export function addCreateService(taskList, {
  image,
  name,
  publishedPort,
  targetPort,
  replicas,
  envFile,
  env,
  hostname,
  mode = 'replicated',
  endpointMode = 'vip',
  networks = []
  // bind,
  // log,
  // volumes,
  // docker,
  // hostLabels
} = {}) {
  taskList.executeScript(`Start ${name}`, {
    script: resolvePath(__dirname, 'assets/create-service.sh'),
    vars: {
      name,
      publishedPort,
      targetPort,
      envFile,
      env: escapeEnv(env),
      image,
      replicas,
      hostname,
      mode,
      endpointMode,
      networks
    }
  });

  return taskList;
}

function diffEnv(wantedEnv, _currentEnv) {
  const toAdd = [];
  const toRemove = [];

  const currentEnv = _currentEnv.reduce((result, env) => {
    const [name, value] = env.split('=');

    result[name] = value;

    return result;
  }, {});

  for (const [name, value] of Object.entries(wantedEnv)) {
    if (!(name in currentEnv) || currentEnv[name] !== value.toString()) {
      toAdd.push({name, value});
    }
  }

  for (const [name] of Object.entries(currentEnv)) {
    if (!(name in wantedEnv)) {
      toRemove.push({name});
    }
  }

  return {
    envAdd: toAdd,
    envRemove: toRemove
  };
}

export function addUpdateService(taskList, {
  name,
  image,
  env,
  hostname
}, currentService) {
  const containerSpec = currentService.Spec.TaskTemplate.ContainerSpec;
  const {
    envAdd,
    envRemove
  } = diffEnv(env, containerSpec.Env);

  // TODO: skip running the script if there is nothing to update
  taskList.executeScript(`Update ${name}`, {
    script: resolvePath(__dirname, 'assets/update-service.sh'),
    vars: {
      image: image !== containerSpec.Image ? image : null,
      hostname: hostname !== containerSpec.Hostname ? hostname : null,
      envAdd: escapeEnv(envAdd),
      envRemove,
      name
    }
  });

  return taskList;
}

export function addCreateOrUpdateService(tasklist, options, currentService) {
  if (currentService) {
    return addUpdateService(tasklist, options, currentService);
  }

  return addCreateService(tasklist, options);
}

export function addStopService(taskList, { name }) {
  taskList.executeScript(`Stop ${name}`, {
    script: resolvePath(__dirname, 'assets/stop-service.sh'),
    vars: {
      name
    }
  });

  return taskList;
}

export function addRestartService(taskList, { name }) {
  taskList.executeScript(`Restart ${name}`, {
    script: resolvePath(__dirname, 'assets/restart-service.sh'),
    vars: {
      name
    }
  });
}
