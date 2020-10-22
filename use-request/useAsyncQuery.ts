import { reactive, toRefs, Ref } from 'vue';
import { Config } from './config';
import Query, { Request, QueryState } from './query';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends unknown[], R> = QueryState<P, R>;

function useAsyncQuery<P extends unknown[], R>(
  queryMethod: Request<P, R>,
  options: Config,
): Ref<BaseResult<P, R>> {
  const queriesList = reactive({});
  queriesList[QUERY_DEFAULT_KEY] = new Query(queryMethod, options);
  return toRefs(queriesList[QUERY_DEFAULT_KEY]);
}

export default useAsyncQuery;
