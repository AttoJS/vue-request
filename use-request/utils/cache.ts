import { State } from 'use-request/createQuery';
import { isNil } from '.';

type CacheDataType<T> = {
  data: T;
  timer?: number;
  cacheTime: number;
};
type CacheKey = string;

const CACHE_MAP = new Map<CacheKey, CacheDataType<any>>();

type GetCacheReturn<R, P extends unknown[]> = Omit<CacheDataType<State<R, P>>, 'timer'> | undefined;
export const getCache = <R, P extends unknown[]>(cacheKey: CacheKey): GetCacheReturn<R, P> => {
  if (isNil(cacheKey)) return;
  const data = CACHE_MAP.get(cacheKey);
  if (!data) return;
  return {
    data: (data.data as unknown) as State<R, P>,
    cacheTime: data.cacheTime,
  };
};

export const setCache = <R, P extends unknown[]>(
  cacheKey: CacheKey,
  data: State<R, P>,
  cacheTime: number,
) => {
  const oldCache = CACHE_MAP.get(cacheKey);
  if (oldCache?.timer) {
    clearTimeout(oldCache.timer);
  }
  const timer = setTimeout(() => CACHE_MAP.delete(cacheKey), cacheTime);
  CACHE_MAP.set(cacheKey, {
    data,
    timer,
    cacheTime: new Date().getTime(),
  });
};

export const clearCache = () => {
  CACHE_MAP.clear();
};
