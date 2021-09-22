import crypto from 'crypto';

export function generateName(groupName) {
  const randomString = crypto.randomBytes(4).toString('hex');

  return `mup-${groupName}-${randomString}`;
}
