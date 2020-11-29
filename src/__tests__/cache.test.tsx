import {
  CacheDataType,
  clearCache,
  getCache,
  setCache,
} from '../core/utils/cache';
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
});
