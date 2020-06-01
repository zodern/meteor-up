const minMajor = 18;

export function checkVersion(version = '') {
  const parts = version.trim().split('.');
  let valid = true;

  if (parseInt(parts[0], 10) < minMajor) {
    valid = false;
  }

  return valid;
}

export function shouldShowDockerWarning(dockers) {
  if (dockers.length === 0) {
    return false;
  }

  const nbDockers = dockers.length;
  const baseVersion = dockers[0].version;
  const sameVersions = dockers.filter(docker => docker.version === baseVersion);

  if (sameVersions.length === nbDockers) {
    return false;
  }

  return true;
}
