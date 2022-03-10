import { definePlugin } from '../definePlugin';
import type { CacheData } from '../utils/cache';
import { getCache, setCache } from '../utils/cache';

export default definePlugin(
  (
    queryInstance,
    {
      cacheKey,
      cacheTime = 600000,
      staleTime = 0,
      getCache: customGetCache,
      setCache: customSetCache,
    },
  ) => {
    if (!cacheKey) return {};
    const _getCache = (key: string) => {
      if (customGetCache) {
        return customGetCache(key);
      } else {
        return getCache(key);
      }
    };

    const _setCache = (key: string, time: number, cacheData: CacheData) => {
      if (customSetCache) {
        return customSetCache(key, cacheData);
      } else {
        return setCache(key, time, cacheData);
      }
    };

    const isFresh = (time: number) =>
      staleTime === -1 || time + staleTime > new Date().getTime();

    // Returns a boolean indicating whether the object has the specified property as its own property
    // (as opposed to inheriting it)
    const hasProp = <T>(object: Partial<Record<keyof T, any>>, prop: keyof T) =>
      Object.prototype.hasOwnProperty.call(object, prop);

    // When initializing, restore if there is a cache
    const cache = _getCache(cacheKey);
    if (cache && hasProp(cache, 'data')) {
      queryInstance.data.value = cache.data;
      queryInstance.params.value = cache.params || [];
    }

    return {
      onBefore() {
        const cache = _getCache(cacheKey);
        if (!cache || !hasProp(cache, 'data')) {
          return {};
        }
        // If it's fresh, stop the request
        if (isFresh(cache.time)) {
          queryInstance.data.value = cache.data;
          queryInstance.loading.value = false;
          return {
            isBreak: true,
            breakResult: cache.data,
          };
        } else {
          // If it is not fresh, set data and request
          queryInstance.data.value = cache.data;
        }
      },
      onSuccess(data, params) {
        _setCache(cacheKey, cacheTime, {
          data,
          params,
          time: new Date().getTime(),
        });
      },
      onMutate(data) {
        _setCache(cacheKey, cacheTime, {
          data,
          params: queryInstance.params,
          time: new Date().getTime(),
        });
      },
    };
  },
);
