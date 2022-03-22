const cacheQuery = new Map<string, Promise<any>>();

export const setCacheQuery = (cacheKey: string, query: Promise<any>) => {
  cacheQuery.set(cacheKey, query);

  query
    .then(res => {
      cacheQuery.delete(cacheKey);
      return res;
    })
    .catch(() => {
      cacheQuery.delete(cacheKey);
    });
};

export const getCacheQuery = (cacheKey: string) => {
  return cacheQuery.get(cacheKey);
};

export const clearCacheQuery = (cacheKey?: string) => {
  if (cacheKey) {
    cacheQuery.delete(cacheKey);
  } else {
    cacheQuery.clear();
  }
};
