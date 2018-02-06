const minMajor = 1;
const minMinor = 13;

export function checkVersion(version = '') {
  const parts = version.trim().split('.');
  let valid = true;

  if (parseInt(parts[0], 10) < minMajor) {
    valid = false;
  } else if (
    parseInt(parts[0], 10) === minMajor &&
    parseInt(parts[1], 10) < minMinor
  ) {
    valid = false;
  }

  return valid;
}
