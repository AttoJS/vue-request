import { BaseOptions, FormatOptions, MixinOptions } from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import generateService from './core/utils/generateService';
import { IService } from './core/utils/types';

function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
): BaseResult<R, P>;
function useRequest<R, P extends unknown[] = any, FR = any>(
  service: IService<R, P>,
  options: FormatOptions<R, P, FR>,
): BaseResult<FR, P>;
function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P>;
function useRequest<R, P extends unknown[], FR>(
  service: IService<R, P>,
  options?: MixinOptions<R, P, FR>,
) {
  const promiseQuery = generateService(service);

  return useAsyncQuery<R, P, FR>(promiseQuery, (options ?? {}) as any);
}

export default useRequest;
