const { describe, it } = require('mocha');
const { checkPackageUpdates } = require('../../../updates');
const chai = require('chai');

const { expect } = chai;

describe('package updates', () => {
  it('should detect update', async () => {
    const result = await checkPackageUpdates('mup', {version: '1.0.0'});
    expect(result).to.equal(true);
  });
});
