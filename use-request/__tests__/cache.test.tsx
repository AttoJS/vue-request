import { getCache, setCache } from '../utils/cache';
import { waitForAll, waitForTime } from './utils';
declare let jsdom: any;

describe('utils', () => {
  const cacheKey = 'test';
  const cacheData = {
    data: { name: 'John' },
    loading: false,
    error: undefined,
    params: [],
  };
  beforeAll(() => {
    jest.useFakeTimers();
  });

  test('setCache and getCache should work', () => {
    setCache<any, any>(cacheKey, cacheData, 10000);
    const data = getCache(cacheKey);
    expect(data?.data).toMatchObject(cacheData);
  });

  test('cacheTime should work', async () => {
    setCache<any, any>(cacheKey, cacheData, 10000);
    expect(getCache(cacheKey)?.data).toMatchObject(cacheData);
    await waitForTime(5000)
    setCache<any, any>(cacheKey, cacheData, 10000);
    await waitForTime(5000);
    expect(getCache(cacheKey)?.data).toMatchObject(cacheData);
    await waitForTime(5000);
    expect(getCache(cacheKey)).toBeUndefined();
  });
});
