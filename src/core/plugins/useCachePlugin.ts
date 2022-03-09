import { definePlugin } from '../definePlugin';
import { getCache, setCache } from '../utils/cache';

export default definePlugin(
  (queryInstance, { cacheKey, cacheTime = 600000, staleTime = 0 }) => {
    if (!cacheKey) return {};

    const cache = getCache(cacheKey);

    if (cache?.data) {
      queryInstance.data.value = cache.data;
      queryInstance.params.value = cache.params;
    }

    const isFresh = (time: number) =>
      staleTime === -1 || time + staleTime > new Date().getTime();

    return {
      onBefore() {
        const cache = getCache(cacheKey);
        if (!cache?.data) {
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
        if (cacheKey) {
          setCache(cacheKey, cacheTime, {
            data,
            params,
            time: new Date().getTime(),
          });
        }
      },
      onMutate(data) {
        if (cacheKey) {
          setCache(cacheKey, cacheTime, {
            data,
            params: queryInstance.params,
            time: new Date().getTime(),
          });
        }
      },
    };
  },
);
