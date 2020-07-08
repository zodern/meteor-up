import {
  getImagePrefix,
  runCommand
} from './utils';
import fs from 'fs';

export function prepareBundleSupported(dockerConfig) {
  const supportedImages = ['abernix/meteord', 'zodern/meteor'];

  if ('prepareBundle' in dockerConfig) {
    return dockerConfig.prepareBundle;
  }

  return supportedImages.find(
    supportedImage => dockerConfig.image.indexOf(supportedImage) === 0
  ) || false;
}

export function createDockerFile(appConfig) {
  const {
    env,
    docker: {
      useBuildKit,
      image
    } = {}
  } = appConfig;

  const syntax = useBuildKit ? '# syntax=docker/dockerfile:1-experimental' : '';
  const args = Object.entries(env).map(([key, value]) => `ARG ${key}=${value}`).join('\n');
  const copy = useBuildKit ?
    'RUN --mount=type=bind,target=/tmp/__mup-bundle tar -xzf /tmp/__mup-bundle/bundle.tar.gz -C /built_app --strip-components=1 && ls /built_app' :
    'COPY ./ /built_app';

  return `
    ${syntax}
    FROM ${image}
    RUN mkdir /built_app || true
    ${args}
    # TODO: build instructions
    ${copy}
    RUN cd /built_app/programs/server && \
      npm install --unsafe-perm
  `;
}

export async function prepareBundleLocally(
  buildLocation, api
) {
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();

  const image = `${getImagePrefix(privateDockerRegistry)}${appConfig.name}`;
  const dockerFile = createDockerFile(appConfig);

  console.log('=> Writing Dockerfile');
  fs.writeFileSync(api.resolvePath(buildLocation, 'bundle/Dockerfile'), dockerFile);

  console.log('');
  console.log('=> Updating base image');
  await runCommand('docker', ['login', '--password', privateDockerRegistry.password, '--username', privateDockerRegistry.username, privateDockerRegistry.host]);
  await runCommand('docker', ['pull', appConfig.docker.image]);

  console.log('');
  console.log('=> Build image');
  const cwd = api.resolvePath(buildLocation, 'bundle');
  if (appConfig.docker.useBuildKit) {
    process.env.USE_BUILDKIT = '1';
  }

  await runCommand('docker', ['build', '-t', `${image}:build`, '.'], cwd);

  console.log('');
  console.log('=> Updating tags');
  // Pull latest image so we can tag is as previous
  // TODO: use docker registry api instead
  await runCommand('docker', ['pull', `${image}:latest`]);
  await runCommand('docker', [
    'tag',
    `${image}:latest`,
    `${image}:previous`
  ]);
  await runCommand('docker', [
    'tag',
    `${image}:build`,
    `${image}:latest`
  ]);
  await runCommand('docker', [
    'push',
    `${image}:previous`
  ]);
  await runCommand('docker', [
    'push',
    `${image}:latest`
  ]);
  console.log('=> Finished preparing bundle');
}
