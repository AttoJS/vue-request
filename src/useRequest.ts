import type { Ref } from 'vue';
import { ref } from 'vue';

import type {
  BaseOptions,
  BaseResult,
  FormatOptions,
  FRPlaceholderType,
  MixinOptions,
} from './core/types';
import useAsyncQuery from './core/useAsyncQuery';
import generateService from './core/utils/generateService';
import type { IService } from './core/utils/types';

export interface RequestResult<R, P extends unknown[]>
  extends Omit<BaseResult<R, P>, 'reset'> {
  reloading: Ref<boolean>;
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
  const { reset, run, ...rest } = useAsyncQuery<R, P>(
    promiseQuery,
    (options ?? {}) as any,
  );

  const reloading = ref(false);
  const reload = async () => {
    const { defaultParams = ([] as unknown) as P, manual } = options!;
    reset();
    if (!manual) {
      reloading.value = true;
      await run(...defaultParams);
      reloading.value = false;
    }
  };

  return {
    reload,
    run,
    reloading,
    ...rest,
  };
}

export default useRequest;
