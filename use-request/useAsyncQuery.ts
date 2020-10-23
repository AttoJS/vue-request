import { reactive, toRefs, Ref, ToRefs } from 'vue';
import { Config } from './config';
import Query, { Request, QueryState } from './query';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends unknown[], R> = QueryState<P, R>;

function useAsyncQuery<P extends unknown[], R>(
  queryMethod: Request<P, R>,
  options: Config,
): BaseResult<P, R> {
  // const queriesList = reactive<Record<string, QueryState<P, R>>>({});
  const query = reactive(new Query(queryMethod, options));
  console.log(query);

  // queriesList[QUERY_DEFAULT_KEY] = ;
  // console.log(queriesList);
  const run = (...args: P) => {
    query.run(...args);
  };
  // @ts-ignore
  return reactive({ ...query.state });
}

export default useAsyncQuery;
