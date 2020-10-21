import { someTest } from '../utils';

describe('this is a jest demo', () => {
  it('demo 1', () => {
    expect(someTest(true)).toBeFalsy();
    expect(someTest(false)).toBeTruthy();
  });
});
