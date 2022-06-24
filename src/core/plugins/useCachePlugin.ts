import { onUnmounted, ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isFunction } from '../utils';
import type { CacheData } from '../utils/cache';
import { getCache, setCache } from '../utils/cache';
import { getCacheQuery, setCacheQuery } from '../utils/cacheQuery';
import { subscribe, trigger } from '../utils/cacheSubscribe';

export default definePlugin(
  (
    queryInstance,
    {
      cacheKey: customCacheKey,
      cacheTime = 600000,
      staleTime = 0,
      getCache: customGetCache,
      setCache: customSetCache,
    },
  ) => {
    if (!customCacheKey) return {};
    const cacheKey = isFunction(customCacheKey)
      ? customCacheKey
      : () => customCacheKey;
    const unSubscribe = ref(() => {});
    let currentQuery: Promise<any>;

    const _getCache = (key: string) => {
      if (customGetCache) {
        return customGetCache(key);
      } else {
        return getCache(key);
      }
    };

    const _setCache = (key: string, time: number, cacheData: CacheData) => {
      if (customSetCache) {
        customSetCache(key, cacheData);
      } else {
        setCache(key, time, cacheData);
      }
      trigger(key, cacheData.data);
    };

    const isFresh = (time: number) =>
      staleTime === -1 || time + staleTime > new Date().getTime();

    // Returns a boolean indicating whether the object has the specified property as its own property
    // (as opposed to inheriting it)
    const hasProp = <T>(object: Partial<Record<keyof T, any>>, prop: keyof T) =>
      Object.prototype.hasOwnProperty.call(object, prop);

    const subscribeCache = (params?: any) => {
      const _cacheKey = cacheKey(params);
      return subscribe(_cacheKey, data => {
        queryInstance.data.value = data;
      });
    };
    // When initializing, restore if there is a cache
    const _cacheKey = cacheKey();
    const cache = _getCache(_cacheKey);
    if (cache && hasProp(cache, 'data')) {
      queryInstance.data.value = cache.data;
      queryInstance.params.value = cache.params;
    }

    if (_cacheKey) {
      unSubscribe.value = subscribeCache();
    }

    onUnmounted(() => {
      unSubscribe.value();
    });

    return {
      onBefore(params) {
        const _cacheKey = cacheKey(params);
        const cache = _getCache(_cacheKey);

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
      onQuery(service) {
        const params = queryInstance.params.value;
        const _cacheKey = cacheKey(params);
        let servicePromise = getCacheQuery(_cacheKey)!;

        if (servicePromise && servicePromise !== currentQuery) {
          return () => servicePromise;
        }
        servicePromise = service();
        currentQuery = servicePromise;
        setCacheQuery(_cacheKey, servicePromise);
        return () => servicePromise;
      },
      onSuccess(data, params) {
        const _cacheKey = cacheKey(params);
        if (_cacheKey) {
          unSubscribe.value();

          _setCache(_cacheKey, cacheTime, {
            data,
            params,
            time: new Date().getTime(),
          });

          unSubscribe.value = subscribeCache(params);
        }
      },
      onMutate(data) {
        const _cacheKey = cacheKey(queryInstance.params.value);
        if (_cacheKey) {
          unSubscribe.value();

          _setCache(_cacheKey, cacheTime, {
            data,
            params: queryInstance.params.value,
            time: new Date().getTime(),
          });

          unSubscribe.value = subscribeCache(queryInstance.params.value);
        }
      },
    };
  },
);
