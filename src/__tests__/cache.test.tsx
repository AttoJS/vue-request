import type { CacheDataType } from '../core/utils/cache';
import { clearCache, getCache, setCache } from '../core/utils/cache';
import { waitForTime } from './utils';

describe('utils', () => {
  const cacheKey = 'test';
  const cacheData: CacheDataType<any, any> = {
    queries: {},
    latestQueriesKey: 'testKey',
  };
  beforeAll(() => {
    jest.useFakeTimers();
    clearCache();
  });

  test('setCache and getCache should work', () => {
    setCache<any, any>(cacheKey, cacheData, 10000);
    const data = getCache(cacheKey);
    expect(data?.data).toMatchObject(cacheData);
  });

  test('cacheTime should work', async () => {
    setCache<any, any>(cacheKey, cacheData, 10000);
    expect(getCache(cacheKey)?.data).toMatchObject(cacheData);
    await waitForTime(5000);
    setCache<any, any>(cacheKey, cacheData, 10000);
    await waitForTime(5000);
    expect(getCache(cacheKey)?.data).toMatchObject(cacheData);
    await waitForTime(5000);
    expect(getCache(cacheKey)).toBeUndefined();
  });

  test('clearCache should work', async () => {
    setCache<any, any>(cacheKey, cacheData, 10000);
    expect(getCache(cacheKey)?.data).toMatchObject(cacheData);
    clearCache();
    expect(getCache(cacheKey)?.data).toBeUndefined();
  });

  test('clear a single cache should work', async () => {
    const cache1 = '1';
    const cache2 = '2';
    setCache<any, any>(cache1, cacheData, 10000);
    setCache<any, any>(cache2, cacheData, 10000);
    expect(getCache(cache1)?.data).toMatchObject(cacheData);
    expect(getCache(cache2)?.data).toMatchObject(cacheData);
    clearCache(cache1);
    expect(getCache(cache1)?.data).toBeUndefined();
    expect(getCache(cache2)?.data).toMatchObject(cacheData);
  });
});
