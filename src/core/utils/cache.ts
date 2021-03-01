import { isNil } from './index';
import { State } from '../createQuery';
import { UnWrapRefObject } from './types';

type CacheResultType<T> = {
  data: T;
  timer?: number;
  cacheTime: number;
};
type CacheKey = string;

const CACHE_MAP = new Map<CacheKey, CacheResultType<any>>();

export type CacheDataType<R, P extends unknown[]> = {
  queries?: { [key: string]: UnWrapRefObject<State<R, P>> };
  latestQueriesKey?: string;
};

type GetCacheReturn<R, P extends unknown[]> =
  | Omit<CacheResultType<CacheDataType<R, P>>, 'timer'>
  | undefined;
export const getCache = <R, P extends unknown[]>(
  cacheKey: CacheKey,
): GetCacheReturn<R, P> => {
  if (isNil(cacheKey)) return;
  const data = CACHE_MAP.get(cacheKey);
  if (!data) return;
  return {
    data: (data.data as unknown) as CacheDataType<R, P>,
    cacheTime: data.cacheTime,
  };
};

export const setCache = <R, P extends unknown[]>(
  cacheKey: CacheKey,
  data: CacheDataType<R, P>,
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

export const clearCache = (cacheKey?: CacheKey) => {
  if (cacheKey) {
    clearTimeout(CACHE_MAP.get(cacheKey)?.timer);
    CACHE_MAP.delete(cacheKey);
  } else {
    // clear timer
    CACHE_MAP.forEach(i => clearTimeout(i.timer));
    CACHE_MAP.clear();
  }
};
