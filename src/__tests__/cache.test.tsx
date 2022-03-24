import { ref } from 'vue-demi';

import type { CacheResultType } from '../core/utils/cache';
import { clearCache, getCache, setCache } from '../core/utils/cache';
import {
  clearCacheQuery,
  getCacheQuery,
  setCacheQuery,
} from '../core/utils/cacheQuery';
import { waitForTime } from './utils';

describe('utils', () => {
  const cacheKey = 'test';
  const cacheData: CacheResultType = {
    data: ref(1),
    time: new Date().getTime(),
    params: ['1'],
  };

  const cachePromise = () =>
    new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });

  const cacheRejectPromise = () =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject();
      }, 1000);
    });
  beforeAll(() => {
    jest.useFakeTimers();
    clearCache();
    clearCacheQuery();
  });

  test('setCache and getCache should work', () => {
    setCache(cacheKey, 10000, cacheData);
    const data = getCache(cacheKey);
    expect(data).toMatchObject(cacheData);
  });

  test('cacheTime should work', async () => {
    setCache(cacheKey, 10000, cacheData);
    expect(getCache(cacheKey)).toMatchObject(cacheData);
    await waitForTime(5000);
    setCache(cacheKey, 10000, cacheData);
    await waitForTime(5000);
    expect(getCache(cacheKey)).toMatchObject(cacheData);
    await waitForTime(5000);
    expect(getCache(cacheKey)).toBeUndefined();
  });

  test('clearCache should work', async () => {
    setCache(cacheKey, 10000, cacheData);
    expect(getCache(cacheKey)).toMatchObject(cacheData);
    clearCache();
    expect(getCache(cacheKey)).toBeUndefined();
  });

  test('clear a single cache should work', async () => {
    const cache1 = '1';
    const cache2 = '2';
    setCache(cache1, 10000, cacheData);
    setCache(cache2, 10000, cacheData);
    expect(getCache(cache1)).toMatchObject(cacheData);
    expect(getCache(cache2)).toMatchObject(cacheData);
    clearCache(cache1);
    expect(getCache(cache1)).toBeUndefined();
    expect(getCache(cache2)).toMatchObject(cacheData);
  });

  test('getCacheQuery and setCacheQuery should work', () => {
    const p = cachePromise();
    setCacheQuery(cacheKey, p);
    const pr = getCacheQuery(cacheKey);
    expect(pr).toBe(p);
  });

  test('clearCacheQuery should work', async () => {
    const p = cachePromise();
    setCacheQuery(cacheKey, p);
    expect(getCacheQuery(cacheKey)).toBe(p);
    clearCacheQuery();
    expect(getCacheQuery(cacheKey)).toBeUndefined();
  });

  test('clear a single query should work', async () => {
    const cache1 = '1';
    const cache2 = '2';
    const p1 = cachePromise();
    const p2 = cachePromise();
    setCacheQuery(cache1, p1);
    setCacheQuery(cache2, p2);
    expect(getCacheQuery(cache1)).toBe(p1);
    expect(getCacheQuery(cache2)).toBe(p2);
    clearCacheQuery(cache1);
    expect(getCacheQuery(cache1)).toBeUndefined();
    expect(getCacheQuery(cache2)).toBe(p2);
  });

  test('query should delete itself when promise is resolve or reject', async () => {
    const cache1 = '1';
    const cache2 = '2';
    const p1 = cachePromise();
    const p2 = cacheRejectPromise();
    setCacheQuery(cache1, p1);
    setCacheQuery(cache2, p2);
    expect(getCacheQuery(cache1)).toBe(p1);
    expect(getCacheQuery(cache2)).toBe(p2);
    await waitForTime(1000);
    expect(getCacheQuery(cache1)).toBeUndefined();
    expect(getCacheQuery(cache2)).toBeUndefined();
  });
});
