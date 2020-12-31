/**
 * @jest-environment node
 */

import { isServer } from '../core/utils';

describe('utils-node-env', () => {
  test('isServer should work', async () => {
    expect(isServer).toBe(true);
  });
});
