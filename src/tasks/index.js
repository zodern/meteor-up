import { resolvePath } from '../utils';

export function addCreateService(taskList, {
  image,
  name,
  publishedPort,
  targetPort,
  replicas,
  envFile,
  env,
  hostname,
  mode = 'replicated'
  // bind,
  // log,
  // volumes,
  // docker,
  // networks,
  // hostLabels
} = {}) {
  taskList.executeScript(`Start ${name}`, {
    script: resolvePath(__dirname, 'assets/create-service.sh'),
    vars: {
      name,
      publishedPort,
      targetPort,
      envFile,
      env,
      image,
      replicas,
      hostname,
      mode
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
  env
}, currentService) {
  const containerSpec = currentService.Spec.TaskTemplate.ContainerSpec;
  const {
    envAdd,
    envRemove
  } = diffEnv(env, containerSpec.Env);

  // TODO: use Start instead of Update in task name when the image is the same
  // TODO: skip running the script if there is nothing to update
  taskList.executeScript(`Update ${name}`, {
    script: resolvePath(__dirname, 'assets/update-service.sh'),
    vars: {
      image: image !== containerSpec.Image ? image : null,
      envAdd,
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
