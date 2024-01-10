import type { Ref } from 'vue-demi';
import { ref, shallowRef } from 'vue-demi';

import type {
  EmitResults,
  FunctionContext,
  Options,
  PluginType,
  Query,
  Service,
  State,
} from './types';
import { isFunction, resolvedPromise, shallowCopy } from './utils';
import type { UnWrapRefObject } from './utils/types';
type StateBindParams = State<any, any> & { status: Query<any, any>['status'] };
const setStateBind = <T extends StateBindParams>(
  oldState: T,
  publicCb: Array<(state: T) => void>,
) => {
  return (newState: Partial<UnWrapRefObject<StateBindParams>>) => {
    Object.keys(newState).forEach(key => {
      if (oldState[key]) {
        oldState[key].value = newState[key];
      }
    });
    publicCb.forEach(fun => fun(oldState));
  };
};

const composeMiddleware = (middleArray: any[], hook: any) => {
  return () => {
    let next = hook;
    for (let i = middleArray.length; i-- > 0; ) {
      next = middleArray[i]!(next);
    }
    return next();
  };
};

const createQuery = <R, P extends unknown[]>(
  service: Service<R, P>,
  config: Options<R, P>,
  initialState?: UnWrapRefObject<State<R, P>>,
): Query<R, P> => {
  const { initialData, onSuccess, onError, onBefore, onAfter } = config;

  const loading = ref(initialState?.loading ?? false);
  const data = shallowRef(initialState?.data ?? initialData) as Ref<R>;
  const error = shallowRef(initialState?.error);
  const params = ref(initialState?.params) as Ref<P>;
  const plugins = ref([]) as Query<R, P>['plugins'];
  const status = shallowRef('pending') as Query<R, P>['status'];

  const context = {} as FunctionContext<R, P>;

  const setState = setStateBind(
    {
      status,
      loading,
      data,
      error,
      params,
    },
    [],
  );

  const emit = (
    event: keyof PluginType<R, P>,
    ...args: any[]
  ): EmitResults<R, P> => {
    if (event === 'onQuery') {
      const queryFn = plugins.value.map(i => i.onQuery).filter(Boolean);
      return { servicePromise: composeMiddleware(queryFn, args[0])() };
    } else {
      // @ts-ignore
      const res = plugins.value.map(i => i[event]?.(...args));
      return Object.assign({}, ...res);
    }
  };

  const count = ref(0);

  context.runAsync = async (...args: P): Promise<R> => {
    setState({
      status: 'pending',
    });

    count.value += 1;
    const currentCount = count.value;

    const {
      isBreak = false,
      isReturn = false,
      ...rest
    } = emit('onBefore', args);
    if (isBreak) {
      setState({ status: 'settled' });
      return resolvedPromise();
    }

    setState({
      loading: true,
      params: args,
      ...rest,
    });

    if (isReturn) {
      setState({ status: 'settled', loading: false });
      return rest.data!;
    }

    onBefore?.(args);

    try {
      const serviceWrapper = () =>
        new Promise<R>(resolve => resolve(service(...params.value)));

      let { servicePromise } = emit('onQuery', serviceWrapper);

      /* istanbul ignore next */
      if (!servicePromise) {
        servicePromise = serviceWrapper();
      }

      const res = await servicePromise;

      if (currentCount !== count.value) return resolvedPromise();

      setState({
        data: res,
        loading: false,
        error: undefined,
        status: 'settled',
      });

      emit('onSuccess', res, args);
      onSuccess?.(res, args);
      if (currentCount === count.value) {
        emit('onAfter', args, res, undefined);
      }
      onAfter?.(args);

      return res;
    } catch (error) {
      if (currentCount !== count.value) return resolvedPromise();

      setState({
        loading: false,
        error: error,
        status: 'settled',
      });

      emit('onError', error, args);
      onError?.(error, args);

      if (currentCount === count.value) {
        emit('onAfter', args, undefined, error);
      }
      onAfter?.(args);

      throw error;
    }
  };

  context.run = (...args: P) => {
    context.runAsync(...args).catch(error => {
      if (!onError) {
        console.error(error);
      }
    });
  };

  context.cancel = () => {
    count.value += 1;
    setState({ loading: false });

    emit('onCancel');
  };

  context.refresh = () => {
    context.run(...(params.value || []));
  };

  context.refreshAsync = () => {
    return context.runAsync(...(params.value || []));
  };

  context.mutate = x => {
    const mutateData = isFunction(x) ? x(data.value) : x;
    const _mutateData = shallowCopy(mutateData);

    setState({
      data: _mutateData,
    });

    emit('onMutate', _mutateData);
  };

  return {
    status,
    loading,
    data,
    error,
    params,
    plugins,
    context,
  };
};

export default createQuery;
