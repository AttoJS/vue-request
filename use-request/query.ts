import { Config } from './config';
// P mean params, R mean Response
export type Request<P extends unknown[], R> = (...args: P) => Promise<R>;
export type Mutate<R> = (newData: R) => void | ((arg: (oldData: R) => R) => void);
export type QueryState<P extends unknown[], R> = {
  loading: boolean;
  data: R | undefined;
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

  that = this;

  state: QueryState<P, R> = {
    loading: false,
    data: undefined,
    error: undefined,
    params: [] as any,
    run: this.run.bind(this.that),
    cancel: this.cancel.bind(this.that),
    refresh: this.refresh.bind(this.that),
    mutate: this.mutate.bind(this.that),
  };

  _run(...args: P) {
    this.state.loading = true;
    return this.request(...args)
      .then(res => {
        this.state.data = res;
        this.state.loading = false;
        this.state.error = undefined;
        return res;
      })
      .catch(error => {
        this.state.data = undefined;
        this.state.loading = false;
        this.state.error = error;

        console.log(error);
        return Promise.reject('已处理的错误');
      })
      .finally(() => {
        console.log('1');
      });
  }

  run(this: any, ...args: P) {
    console.log(args);
    return this._run(...args);
  }

  cancel() {
    return;
  }

  refresh() {
    return this.run(...this.state.params);
  }

  mutate(mutate: any | ((x: any) => any)) {
    if (typeof mutate === 'function') {
      this.state.data = mutate(this.state.data);
    } else {
      this.state.data = mutate;
    }
  }
}
