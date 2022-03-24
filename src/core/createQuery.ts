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
import { isFunction, resolvedPromise } from './utils';
import type { UnWrapRefObject } from './utils/types';

const setStateBind = <R, P extends unknown[], T extends State<R, P>>(
  oldState: T,
  publicCb: Array<(state: T) => void>,
) => {
  return (newState: Partial<UnWrapRefObject<State<R, P>>>) => {
    Object.keys(newState).forEach(key => {
      oldState[key].value = newState[key];
    });
    publicCb.forEach(fun => fun(oldState));
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

  const context = {} as FunctionContext<R, P>;

  const setState = setStateBind(
    {
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
    // @ts-ignore
    const res = plugins.value.map(i => i[event]?.(...args));
    return Object.assign({}, ...res);
  };

  const count = ref(0);

  context.runAsync = async (...args: P) => {
    setState({
      loading: true,
      params: args,
    });

    count.value += 1;
    const currentCount = count.value;

    const { isBreak, breakResult = resolvedPromise } = emit('onBefore', args);
    if (isBreak) return breakResult;

    onBefore?.(args);

    try {
      let { servicePromise } = emit('onQuery', service, params.value);
      if (!servicePromise) {
        servicePromise = service(...params.value);
      }

      const res = await servicePromise;

      if (currentCount !== count.value) return resolvedPromise;

      setState({
        data: res,
        loading: false,
        error: undefined,
      });

      emit('onSuccess', res, args);
      onSuccess?.(res, args);

      emit('onAfter', args, res, undefined);
      onAfter?.(args);

      return res;
    } catch (error) {
      if (currentCount !== count.value) return resolvedPromise;

      setState({
        loading: false,
        error: error,
      });

      emit('onError', error, args);
      onError?.(error, args);

      emit('onAfter', args, undefined, error);
      onAfter?.(args);

      throw error;
    }
  };

  context.run = async (...args: P) => {
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
    context.run(...params.value);
  };

  context.refreshAsync = () => {
    return context.runAsync(...params.value);
  };

  context.mutate = x => {
    const mutateData = isFunction(x) ? x(data.value) : x;
    setState({
      data: mutateData,
    });

    emit('onMutate', mutateData);
  };

  return {
    loading,
    data,
    error,
    params,
    plugins,
    context,
  };
};

export default createQuery;
