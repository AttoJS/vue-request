import { onUnmounted, ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import type { CacheData } from '../utils/cache';
import { getCache, setCache } from '../utils/cache';
import { getCacheQuery, setCacheQuery } from '../utils/cacheQuery';
import { subscribe, trigger } from '../utils/cacheSubscribe';

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

    const unSubscribe = ref();
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

    const subscribeCache = () =>
      subscribe(cacheKey, data => {
        queryInstance.data.value = data;
      });

    // When initializing, restore if there is a cache
    const cache = _getCache(cacheKey);
    if (cache && hasProp(cache, 'data')) {
      queryInstance.data.value = cache.data;
      queryInstance.params.value = cache.params || [];
    }

    unSubscribe.value = subscribeCache();

    onUnmounted(() => {
      unSubscribe.value?.();
    });

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
      onQuery(service, params) {
        let servicePromise = getCacheQuery(cacheKey);

        if (servicePromise && servicePromise !== currentQuery) {
          return { servicePromise };
        }

        servicePromise = service(...params);
        currentQuery = servicePromise;
        setCacheQuery(cacheKey, servicePromise);
        return { servicePromise };
      },
      onSuccess(data, params) {
        unSubscribe.value?.();

        _setCache(cacheKey, cacheTime, {
          data,
          params,
          time: new Date().getTime(),
        });

        unSubscribe.value = subscribeCache();
      },
      onMutate(data) {
        unSubscribe.value?.();

        _setCache(cacheKey, cacheTime, {
          data,
          params: queryInstance.params.value,
          time: new Date().getTime(),
        });

        unSubscribe.value = subscribeCache();
      },
    };
  },
);
