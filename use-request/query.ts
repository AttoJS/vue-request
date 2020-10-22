import { Config } from './config';
// P mean params, R mean Response
export type Request<P extends unknown[], R> = (...args: P) => Promise<R>;
export type Mutate<R> = (newData: R) => void | ((arg: (oldData: R) => R) => void);
export type QueryState<P extends unknown[], R> = {
  loading: boolean;
  data: R;
  error: Error | undefined;
  params: P;
  run: (...arg: P) => Promise<R>;
  cancel: () => void;
  refresh: () => Promise<R>;
  mutate: Mutate<R>;
};

export default class Query<P extends unknown[], R> {
  constructor(request: Request<P, R>, config: Config) {
    this.request = request;
    this.config = config;
  }

  request: Request<P, R>;

  config: Config;

  state: QueryState<P, R> = {
    loading: false,
    data: undefined,
    error: undefined,
    params: [] as any,
    run: this.run,
    cancel: this.cancel,
    refresh: this.refresh,
    mutate: this.mutate,
  };

  _run(...args: P) {
    return this.request(...args)
      .then(res => {
        return res;
      })
      .catch(error => {
        console.log(error);
        return Promise.reject('已处理的错误');
      })
      .finally(() => {
        console.log('1');
      });
  }

  run(...args: P) {
    console.log(args);
    return this._run(...args);
  }

  cancel() {
    return;
  }

  refresh() {
    return this.run(...this.state.params);
  }

  mutate(mutate: R | ((x: R) => R)) {
    if (typeof mutate === 'function') {
      this.state.data = mutate(this.state.data);
    } else {
      this.state.data = mutate;
    }
  }
}
