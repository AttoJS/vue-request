import { isNil } from './index';
import type { Timeout } from './types';

export type CacheData<R = any, P = any> = {
  data: R;
  params: P;
  time: number;
};

export type CacheResultType = CacheData & {
  timer?: Timeout;
};
type CacheKey = string;

const CACHE_MAP = new Map<CacheKey, CacheResultType>();

export const getCache = (cacheKey: CacheKey) => {
  if (isNil(cacheKey)) return;
  const data = CACHE_MAP.get(cacheKey);
  return data;
};

export const setCache = (
  cacheKey: CacheKey,
  cacheTime: number,
  data: CacheData,
) => {
  const oldCache = CACHE_MAP.get(cacheKey);
  if (oldCache?.timer) {
    clearTimeout(oldCache.timer);
  }
  const timer = setTimeout(() => CACHE_MAP.delete(cacheKey), cacheTime);
  CACHE_MAP.set(cacheKey, {
    ...data,
    timer,
  });
};

export const clearCache = (cacheKey?: CacheKey) => {
  if (cacheKey) {
    const timer = CACHE_MAP.get(cacheKey)?.timer;
    timer && clearTimeout(timer);
    CACHE_MAP.delete(cacheKey);
  } else {
    // clear timer
    CACHE_MAP.forEach(i => i.timer && clearTimeout(i.timer));
    CACHE_MAP.clear();
  }
};
