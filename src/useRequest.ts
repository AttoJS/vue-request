import {
  BaseOptions,
  FormatOptions,
  FRPlaceholderType,
  MixinOptions,
} from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import generateService from './core/utils/generateService';
import { IService } from './core/utils/types';

export interface RequestResult<R, P extends unknown[]>
  extends Omit<BaseResult<R, P>, 'reset'> {
  reload: () => void;
}
function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
): RequestResult<R, P>;
function useRequest<R, P extends unknown[] = any, FR = FRPlaceholderType>(
  service: IService<R, P>,
  options: FormatOptions<R, P, FR>,
): RequestResult<FR, P>;
function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
  options: BaseOptions<R, P>,
): RequestResult<R, P>;
function useRequest<R, P extends unknown[], FR>(
  service: IService<R, P>,
  options?: MixinOptions<R, P, FR>,
) {
  const promiseQuery = generateService(service);
  const { reset, run, ...rest } = useAsyncQuery<R, P, FR>(
    promiseQuery,
    (options ?? {}) as any,
  );

  const reload = () => {
    const { defaultParams = ([] as unknown) as P, manual } = options!;
    reset();
    !manual && run(...defaultParams);
  };

  return {
    reload,
    run,
    ...rest,
  };
}

export default useRequest;
