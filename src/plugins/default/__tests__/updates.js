import { describe, it } from 'mocha';
import { checkPackageUpdates } from '../../../updates';
import { expect } from 'chai';

describe('package updates', () => {
  it('should detect update', async () => {
    const result = await checkPackageUpdates('mup', {version: '1.0.0'});
    expect(result).to.equal(true);
  });
});
