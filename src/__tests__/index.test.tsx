import fetchMock from 'fetch-mock';
import type { Ref } from 'vue-demi';
import { defineComponent, reactive, ref } from 'vue-demi';

import { clearGlobalOptions, setGlobalOptions } from '../core/config';
import { clearCache } from '../core/utils/cache';
import { clearCacheQuery } from '../core/utils/cacheQuery';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { useRequest } from '../index';
import { mount, waitForAll, waitForTime } from './utils';
import { failedRequest, request } from './utils/request';
declare let jsdom: any;

describe('useRequest', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  const successApi = 'http://example.com/200';
  const failApi = 'http://example.com/404';
  // mock fetch
  fetchMock.get(successApi, { data: 'success' });
  fetchMock.get(failApi, 404);

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
    // clear cache
    clearCache();
    // clear query cache
    clearCacheQuery();
    // clear global options
    clearGlobalOptions();

    // clear listener
    RECONNECT_LISTENER.clear();
    FOCUS_LISTENER.clear();
    VISIBLE_LISTENER.clear();
  });

  afterEach(() => {
    console.error = originalError;
  });

  test('should be defined', () => {
    expect(useRequest).toBeDefined();
  });

  test('should auto run', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data } = useRequest(request);
          const test = ref(1);
          return {
            data,
            test,
          };
        },
      }),
    );
    expect(wrapper.data).toBeUndefined();
    await waitForAll();
    expect(wrapper.data).toBe('success');
  });

  test('can be manually triggered', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, run } = useRequest(request, { manual: true });

          return {
            data,
            run,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.run();
    await waitForAll();
    expect(wrapper.data).toBe('success');
  });

  test('params should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, params } = useRequest(request, {
            defaultParams: ['hello', 'world'],
          });
          return {
            params,
            run,
          };
        },
      }),
    );

    await waitForTime(1000);
    expect(wrapper.params.join(',')).toBe('hello,world');
    wrapper.run('hi there');
    await waitForTime(1000);
    expect(wrapper.params.join(',')).toEqual('hi there');
  });

  test('defaultParams should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data } = useRequest(request, {
            defaultParams: ['hello', 'world'],
          });

          return {
            data,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBe('hello,world');
  });

  test('run can be accept params', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, run } = useRequest(request);

          return {
            run: () => run('hello', 'world'),
            data,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBe('success');
    wrapper.run();
    await waitForAll();
    expect(wrapper.data).toBe('hello,world');
  });

  test('mutate should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, mutate } = useRequest(request);

          return {
            mutate: () => mutate('ok'),
            data,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBe('success');
    wrapper.mutate();
    expect(wrapper.data).toBe('ok');
  });

  test('mutate callback should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, mutate } = useRequest(request);

          return {
            mutate: () => mutate(() => 'ok'),
            data,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBe('success');
    wrapper.mutate();
    expect(wrapper.data).toBe('ok');
  });

  test('refresh should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { refresh, loading } = useRequest(request);

          return {
            refresh,
            loading,
          };
        },
      }),
    );
    wrapper.refresh();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.loading).toBe(false);
  });

  test('refreshAsync should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { refreshAsync, loading } = useRequest(request);

          return {
            refreshAsync,
            loading,
          };
        },
      }),
    );
    wrapper.refreshAsync().then((res: any) => {
      expect(res).toBe('success');
    });
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.loading).toBe(false);
  });

  test('run should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, loading } = useRequest(request);

          return {
            run,
            loading,
          };
        },
      }),
    );
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.loading).toBe(false);
  });

  test('runAsync should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { runAsync, loading } = useRequest(request);

          return {
            runAsync,
            loading,
          };
        },
      }),
    );
    wrapper.runAsync().then((res: any) => {
      expect(res).toBe('success');
    });
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.loading).toBe(false);
  });

  test('log request error by default', async () => {
    console.error = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(failedRequest, { manual: true });
          return {
            run,
          };
        },
      }),
    );
    wrapper.run();
    await waitForAll();
    expect(console.error).toHaveBeenCalledWith(new Error('fail'));
  });

  test('onSuccess should work', async () => {
    const mockSuccessCallback = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(request, {
            manual: true,
            onSuccess: mockSuccessCallback,
          });
          return {
            run,
          };
        },
      }),
    );
    wrapper.run();

    await waitForAll();
    expect(mockSuccessCallback).toHaveBeenCalledWith('success', []);
  });

  test('onError should work', async () => {
    const mockErrorCallback = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(failedRequest, {
            manual: true,
            onError: mockErrorCallback,
          });
          return {
            run,
          };
        },
      }),
    );
    wrapper.run();
    await waitForAll();
    expect(mockErrorCallback).toHaveBeenCalledWith(new Error('fail'), []);
  });

  test('initData should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data } = useRequest(request, {
            initialData: 'init',
          });

          return { data };
        },
      }),
    );
    expect(wrapper.data).toBe('init');
    await waitForAll();
    expect(wrapper.data).toBe('success');
  });

  test('ready should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);

          const { data } = useRequest(request, {
            ready: readyRef,
          });
          const handleUpdateReady = () => {
            readyRef.value = true;
          };
          return {
            data,
            handleUpdateReady,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.handleUpdateReady();
    await waitForAll();
    expect(wrapper.data).toBe('success');
  });

  test('ready should save the first time request params', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);
          const { data, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
          });
          const handleUpdateReady = () => {
            readyRef.value = true;
          };
          return {
            handleUpdateReady,
            run: () => run('run'),
            data,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.handleUpdateReady();
    await waitForAll();
    expect(wrapper.data).toBe('default');
    wrapper.run();
    await waitForAll();
    expect(wrapper.data).toBe('run');
  });

  test('track ready when ready initial value is true', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(true);
          const count = ref(0);
          const { data, run, loading } = useRequest(request, {
            ready: readyRef,
            defaultParams: [count.value],
          });

          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
            count.value += 1;
            run(count.value);
          };
          return {
            data,
            loading,
            handleUpdateReady,
          };
        },
      }),
    );
    await waitForAll();
    expect(wrapper.data).toBe('0');
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('0');

    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('2');
  });

  test('ready should work when manual is true', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);
          const { data, loading, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
            manual: true,
          });
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            handleUpdateReady,
            run: () => run(`${(count += 1)}`),
            data,
            loading,
          };
        },
      }),
    );
    // ready = false
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBeUndefined();

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('2');

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('2');

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('4');
  });

  test('ready should work when manual is false', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);
          const { data, loading, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
          });
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            handleUpdateReady,
            run: () => run(`${(count += 1)}`),
            data,
            loading,
          };
        },
      }),
    );
    // ready = false
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBeUndefined();

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('default');
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('2');

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('2');

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('default');
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('4');
  });

  test('ready should work when manual is true and ready is true', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(true);
          const { data, loading, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
            manual: true,
          });
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            handleUpdateReady,
            run: () => run(`${(count += 1)}`),
            data,
            loading,
          };
        },
      }),
    );
    // ready = true
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('1');

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('1');

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('1');
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('3');
  });

  test('ready should work when manual is false and ready is true', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(true);
          const { data, loading, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
          });
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            handleUpdateReady,
            run: () => run(`${(count += 1)}`),
            data,
            loading,
          };
        },
      }),
    );
    // ready = true
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('default');
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('1');

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForAll();
    expect(wrapper.data).toBe('1');

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('default');
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.data).toBe('3');
  });

  test('refreshDeps should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const refreshRef = ref(0);
          const refreshReactive = reactive({
            count: 0,
          });
          const { loading } = useRequest(request, {
            refreshDeps: [refreshRef, () => refreshReactive.count],
          });

          const handleUpdateRef = () => {
            refreshRef.value++;
          };

          const handleUpdateReactive = () => {
            refreshReactive.count++;
          };

          return {
            loading,
            handleUpdateRef,
            handleUpdateReactive,
          };
        },
      }),
    );
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    for (let index = 0; index < 100; index++) {
      wrapper.handleUpdateRef();
      await waitForTime(1);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }

    for (let index = 0; index < 100; index++) {
      wrapper.handleUpdateReactive();
      await waitForTime(1);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }
  });

  test('loadingDelay should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading } = useRequest(request, {
            loadingDelay: 800,
          });

          return {
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(false);
    await waitForTime(800);
    expect(wrapper.loading).toBe(true);
    await waitForTime(200);
    expect(wrapper.loading).toBe(false);
  });

  test('loadingDelay should be reactive', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const loadingDelay = ref(800);
          const { loading, run } = useRequest(request, {
            loadingDelay,
            manual: true,
          });

          const changeLoadingDelay = () => {
            loadingDelay.value = 0;
          };
          return {
            run,
            loading,
            changeLoadingDelay,
          };
        },
      }),
    );
    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForTime(800);
    expect(wrapper.loading).toBe(true);
    await waitForTime(200);
    expect(wrapper.loading).toBe(false);

    wrapper.changeLoadingDelay();
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('cancel loadingDelay should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, cancel } = useRequest(request, {
            loadingDelay: 800,
          });

          return {
            loading,
            cancel,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(false);
    await waitForTime(800);
    expect(wrapper.loading).toBe(true);
    wrapper.cancel();
    expect(wrapper.loading).toBe(false);
  });

  test('cancel should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { cancel, data, run } = useRequest(request);

          return {
            cancel,
            run,
            data,
          };
        },
      }),
    );

    expect(wrapper.data).toBeUndefined();
    wrapper.cancel();
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.run();
    await waitForAll();
    expect(wrapper.data).toBe('success');
  });

  test('cancel should work when request error', async () => {
    console.error = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, run, cancel } = useRequest(failedRequest, {
            manual: true,
          });
          return {
            data,
            run,
            cancel,
          };
        },
      }),
    );
    expect(wrapper.data).toBeUndefined();
    wrapper.run();
    await waitForTime(200);
    wrapper.cancel();
    await waitForAll();
    expect(wrapper.data).toBeUndefined();
    wrapper.run();
    await waitForAll();
    expect(console.error).toHaveBeenCalledWith(new Error('fail'));
  });

  test('pollingInterval should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, cancel } = useRequest(request, {
            pollingInterval: 500,
          });

          return {
            cancel,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    await waitForTime(500);
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    wrapper.cancel();
    waitForTime(600);
    expect(wrapper.loading).toBe(false);
  });

  test('pollingInterval less than 0 should not work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, cancel } = useRequest(request, {
            pollingInterval: -0.1,
          });

          return {
            cancel,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    await waitForTime(10);
    expect(wrapper.loading).toBe(false);
  });

  test('pollingWhenHidden be false should work', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data } = useRequest(() => request((count += 1)), {
            pollingInterval: 1000,
            pollingWhenHidden: false,
          });

          return {
            data,
          };
        },
      }),
    );

    expect(wrapper.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapper.data).toBe('1');
    await waitForTime(2000);
    expect(wrapper.data).toBe('2');
    // mock tab hide
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    await waitForTime(2000);
    expect(wrapper.data).toBe('3');
    await waitForTime(2000);
    expect(wrapper.data).toBe('3');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.data).toBe('4');
    await waitForTime(2000);
    expect(wrapper.data).toBe('5');
  });

  test('pollingWhenHidden be true should work', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data } = useRequest(() => request((count += 1)), {
            pollingInterval: 1000,
            pollingWhenHidden: true,
          });

          return {
            data,
          };
        },
      }),
    );

    expect(wrapper.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapper.data).toBe('1');
    await waitForTime(2000);
    expect(wrapper.data).toBe('2');
    // mock tab hide
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    await waitForTime(2000);
    expect(wrapper.data).toBe('3');
    await waitForTime(2000);
    expect(wrapper.data).toBe('4');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    // because pollingWhenHidden is true, so refresh never trigger
    expect(wrapper.data).toBe('4');
    await waitForTime(2000);
    expect(wrapper.data).toBe('5');
  });

  test('refreshOnWindowFocus should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, run } = useRequest(request, {
            refreshOnWindowFocus: true,
          });

          return {
            run,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(false);

    // wait for 5s
    await waitForTime(4000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('refocusTimespan should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, run } = useRequest(request, {
            refreshOnWindowFocus: true,
            refocusTimespan: 3000,
          });

          return {
            run,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(false);

    // wait for 3s
    await waitForTime(3000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('refocusTimespan should be reactive', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const refocusTimespan = ref(3000);
          const { loading } = useRequest(request, {
            refreshOnWindowFocus: true,
            refocusTimespan,
          });

          const changeRefocusTimespan = () => {
            refocusTimespan.value = 5000;
          };

          return {
            changeRefocusTimespan,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // wait for 3s
    await waitForTime(3000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // set refocusTimespan = 5000
    wrapper.changeRefocusTimespan();
    // mock nexttick
    await waitForTime(1);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    await waitForTime(3000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(false);

    await waitForTime(2000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
  });

  test('refreshOnWindowFocus should be reactive', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const refreshOnWindowFocus = ref(true);
          const { loading } = useRequest(request, {
            refreshOnWindowFocus,
          });

          const changeRefreshOnWindowFocus = () => {
            refreshOnWindowFocus.value = !refreshOnWindowFocus.value;
          };

          return {
            changeRefreshOnWindowFocus,
            loading,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    // wait for 5s
    await waitForTime(5000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // set refreshOnWindowFocus false
    wrapper.changeRefreshOnWindowFocus();
    await waitForTime(5000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(false);

    // set refreshOnWindowFocus true
    wrapper.changeRefreshOnWindowFocus();
    await waitForTime(5000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(wrapper.loading).toBe(true);
  });

  test('debounceInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('debounceInterval should work with runAsync', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { runAsync } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              manual: true,
            },
          );
          return {
            runAsync,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.runAsync();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      wrapper.runAsync();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('debounceInterval should be reactive', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const debounceInterval = ref(100);
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval,
              manual: true,
            },
          );

          const changeDebounceInterval = () => {
            debounceInterval.value = 50;
          };
          return {
            run,
            changeDebounceInterval,
          };
        },
      }),
    );
    for (let index = 0; index <= 10; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    wrapper.changeDebounceInterval();

    for (let index = 0; index <= 10; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(11);
  });

  test('debounce will be cancelled when debounceInterval changes', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const debounceInterval = ref(100);
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval,
              manual: true,
            },
          );

          const changeDebounceInterval = () => {
            debounceInterval.value = 150;
          };
          return {
            run,
            changeDebounceInterval,
          };
        },
      }),
    );
    wrapper.run();
    expect(mockFn).toHaveBeenCalledTimes(0);
    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(0);

    wrapper.changeDebounceInterval();
    await waitForTime(1);

    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(0);

    wrapper.run();
    await waitForTime(150);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('debounceOptions should work: case 1', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              debounceOptions: {
                leading: true,
                trailing: false,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(1);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(2);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('debounceOptions should work: case 2', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              debounceOptions: {
                leading: false,
                trailing: false,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(0);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(0);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  test('debounceOptions should work: case 3', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 500,
              debounceOptions: {
                maxWait: 1000,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(5);
    await waitForTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(5);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(10);
    await waitForTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(10);
  });

  test('debounceOptions should be reactive', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const debounceOptions = reactive<any>({
            leading: false,
            trailing: true,
          });
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              debounceOptions,
              manual: true,
            },
          );
          const changeOptions = (type: 1 | 2) => {
            switch (type) {
              case 1:
                debounceOptions.leading = true;
                debounceOptions.trailing = false;
                break;

              case 2:
                debounceOptions.leading = false;
                debounceOptions.trailing = true;
                debounceOptions.maxWait = 1000;
                break;
            }
          };
          return {
            run,
            changeOptions,
          };
        },
      }),
    );
    wrapper.changeOptions(1);
    await waitForTime(1);
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(1);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(2);
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);

    wrapper.changeOptions(2);
    await waitForTime(1);
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(7);
    await waitForTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(7);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    expect(mockFn).toHaveBeenCalledTimes(12);
    await waitForTime(1000);
    expect(mockFn).toHaveBeenCalledTimes(12);
  });

  test('debounceInterval should work with cancel', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, cancel } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
              manual: true,
            },
          );
          return {
            run,
            cancel,
          };
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }
    wrapper.cancel();
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);

    for (let index = 0; index < 100; index++) {
      wrapper.run();
      await waitForTime(50);
    }

    wrapper.cancel();
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  test('initial auto run should debounce', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              debounceInterval: 100,
            },
          );
          return {
            run,
          };
        },
      }),
    );
    expect(mockFn).toHaveBeenCalledTimes(1);

    wrapper.run();
    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();
    wrapper.run();
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    // have been call 3 times
    // because the function will invoking on the leading edge and trailing edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('throttleInterval should work with runAsync', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { runAsync } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              manual: true,
            },
          );
          return {
            runAsync,
          };
        },
      }),
    );

    wrapper.runAsync();

    await waitForTime(50);
    wrapper.runAsync();
    wrapper.runAsync();
    wrapper.runAsync();

    await waitForTime(50);
    wrapper.runAsync();

    await waitForAll();
    // have been call 3 times
    // because the function will invoking on the leading edge and trailing edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('throttleInterval should be reactive', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const throttleInterval = ref(100);
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval,
              manual: true,
            },
          );

          const changeThrottleInterval = () => {
            throttleInterval.value = 1000;
          };
          return {
            run,
            changeThrottleInterval,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();
    wrapper.run();
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(3);

    wrapper.changeThrottleInterval();
    await waitForTime(1);

    wrapper.run();
    await waitForTime(400);
    wrapper.run();
    wrapper.run();
    wrapper.run();

    await waitForTime(400);
    wrapper.run();
    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  test('throttle will be cancelled when throttleInterval changes', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const throttleInterval = ref(100);
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval,
              manual: true,
            },
          );

          const changeThrottleInterval = () => {
            throttleInterval.value = 1000;
          };
          return {
            run,
            changeThrottleInterval,
          };
        },
      }),
    );
    wrapper.run();
    expect(mockFn).toHaveBeenCalledTimes(1);
    await waitForTime(50);
    wrapper.run();
    expect(mockFn).toHaveBeenCalledTimes(1);

    wrapper.changeThrottleInterval();
    await waitForTime(1);

    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);

    wrapper.run();
    expect(mockFn).toHaveBeenCalledTimes(2);
    await waitForTime(100);
    wrapper.run();
    await waitForTime(100);
    wrapper.run();
    await waitForTime(100);
    wrapper.run();

    await waitForTime(700);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('throttleOptions should work, case: 1', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              throttleOptions: {
                leading: false,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    // have been call 2 times
    // because the function will only invoking on the trailing edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleOptions should work, case: 2', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              throttleOptions: {
                trailing: false,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    // have been call 2 times
    // because the function will only invoking on the leading edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleOptions should work, case: 3', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              throttleOptions: {
                leading: false,
                trailing: false,
              },
              manual: true,
            },
          );
          return {
            run,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  test('throttleOptions should be reactive', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const throttleOptions = reactive<any>({
            leading: true,
          });
          const { run } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              throttleOptions,
              manual: true,
            },
          );

          const changeThrottleOptions = () => {
            throttleOptions.leading = false;
          };
          return {
            run,
            changeThrottleOptions,
          };
        },
      }),
    );

    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(3);

    wrapper.changeThrottleOptions();
    await waitForTime(1);

    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForTime(50);
    wrapper.run();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  test('throttleInterval should work with cancel', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, cancel } = useRequest(
            () => {
              mockFn();
              return request();
            },
            {
              throttleInterval: 100,
              manual: true,
            },
          );
          return {
            run,
            cancel,
          };
        },
      }),
    );
    wrapper.run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(1);
    await waitForTime(10);
    wrapper.cancel();

    wrapper.run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(2);
    await waitForTime(10);
    wrapper.cancel();

    wrapper.run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(3);
    await waitForTime(50);
    wrapper.run();
    wrapper.run();

    await waitForAll();
    // trigger by trailing
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  test('cache should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return {
          run: () => run((count += 1)),
          data,
        };
      },
    });

    let wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');
    for (let index = 0; index < 5; index++) {
      wrapper.run();
      await waitForTime(1000);
    }

    expect(wrapper.data).toBe('5');
    wrapper.unmount();

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.data).toBe('5');
    await waitForTime(1000);
    expect(wrapper.data).toBe('5');
    for (let index = 0; index < 5; index++) {
      wrapper.run();
      await waitForTime(1000);
    }
    expect(wrapper.data).toBe('10');
    wrapper.unmount();
    // waiting for cache timeout
    waitForTime(10000);

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
  });

  test('cache query should work', async () => {
    const mockFn = jest.fn();
    const commonRequest = (...args: any[]) => {
      mockFn();
      return request(...args);
    };
    const TestComponentA = defineComponent({
      template: '<div/>',
      setup() {
        const { data, loading, run } = useRequest(commonRequest, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        let count = 0;
        return {
          run: () => run((count += 1)),
          loading,
          data,
        };
      },
    });

    const TestComponentB = defineComponent({
      template: '<div/>',
      setup() {
        const { data, loading, run } = useRequest(commonRequest, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        let count = 0;
        return {
          run: () => run((count += 1)),
          loading,
          data,
        };
      },
    });

    const wrapperA = mount(TestComponentA);
    const wrapperB = mount(TestComponentB);
    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');

    expect(mockFn).toHaveBeenCalledTimes(1);

    wrapperA.run();
    expect(wrapperA.loading).toBe(true);
    expect(wrapperB.loading).toBe(false);
    await waitForTime(500);
    wrapperB.run();
    expect(wrapperA.loading).toBe(true);
    expect(wrapperB.loading).toBe(true);
    await waitForTime(500);
    expect(wrapperA.loading).toBe(false);
    expect(wrapperB.loading).toBe(false);

    wrapperB.run();
    expect(wrapperB.loading).toBe(true);
    expect(wrapperA.loading).toBe(false);
    await waitForTime(500);
    wrapperA.run();
    expect(wrapperB.loading).toBe(true);
    expect(wrapperA.loading).toBe(true);
    await waitForTime(500);
    expect(wrapperB.loading).toBe(false);
    expect(wrapperA.loading).toBe(false);

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('cache staleTime should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      template: '<div/>',
      setup() {
        const { data, loading, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          staleTime: 5000,
        });
        return {
          run: () => run((count += 1)),
          data,
          loading,
        };
      },
    });
    let wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
    expect(wrapper.loading).toBe(true);

    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('success');

    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('success');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('success');

    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');
    wrapper.unmount();

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('3');

    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('3');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('5');

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('5');
  });

  test('custom cache should work', async () => {
    const store = {};
    const key = 'cacheKey';
    let count = 0;
    const TestComponent = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          setCache: (key, data) => {
            store[key] = data;
          },
          getCache: key => store[key],
        });
        return {
          run: () => run((count += 1)),
          data,
        };
      },
    });

    let wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
    expect(store[key]).toBeUndefined();
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');
    expect(store[key].data).toBe('success');
    expect(store[key].params).toMatchObject([]);

    for (let index = 0; index < 5; index++) {
      wrapper.run();
      await waitForTime(1000);
    }

    expect(wrapper.data).toBe('5');
    expect(store[key].data).toBe('5');
    expect(store[key].params).toMatchObject([5]);
    wrapper.unmount();

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.data).toBe('5');
    expect(store[key].data).toBe('5');
    expect(store[key].params).toMatchObject([5]);
    await waitForTime(1000);
    expect(wrapper.data).toBe('5');
    expect(store[key].data).toBe('5');
    expect(store[key].params).toMatchObject([5]);
    for (let index = 0; index < 5; index++) {
      wrapper.run();
      await waitForTime(1000);
    }
    expect(wrapper.data).toBe('10');
    expect(store[key].params).toMatchObject([10]);
    expect(store[key].data).toBe('10');
  });

  test('custom cache should work with staleTime', async () => {
    const store = {};
    const key = 'cacheKey';
    let count = 0;
    const TestComponent = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run, loading } = useRequest(request, {
          cacheKey: 'cacheKey',
          staleTime: 5000,
          setCache: (key, data) => {
            store[key] = data;
          },
          getCache: key => store[key],
        });
        return {
          run: () => run((count += 1)),
          data,
          loading,
        };
      },
    });

    let wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
    expect(store[key]).toBeUndefined();
    expect(wrapper.loading).toBe(true);

    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(store[key].data).toBe('success');
    expect(wrapper.data).toBe('success');

    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(store[key].data).toBe('success');
    expect(wrapper.data).toBe('success');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('success');
    expect(store[key].data).toBe('success');

    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');
    expect(store[key].data).toBe('2');
    wrapper.unmount();

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');
    expect(store[key].data).toBe('2');
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('2');
    expect(store[key].data).toBe('2');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('3');
    expect(store[key].data).toBe('3');

    wrapper.run();
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('3');
    expect(store[key].data).toBe('3');

    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 4000);
    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('5');
    expect(store[key].data).toBe('5');

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.data).toBe('5');
    expect(store[key].data).toBe('5');
  });

  test('cache can be shared', async () => {
    let count = 0;
    const TestComponentA = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return {
          run: () => run((count += 1)),
          data,
        };
      },
    });

    const TestComponentB = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return {
          run: () => run((count += 1)),
          data,
        };
      },
    });

    let wrapperA = mount(TestComponentA);
    let wrapperB = mount(TestComponentB);
    expect(wrapperA.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');
    for (let index = 0; index < 5; index++) {
      wrapperA.run();
      await waitForTime(1000);
    }

    expect(wrapperA.data).toBe('5');
    expect(wrapperB.data).toBe('5');
    wrapperA.unmount();
    wrapperB.unmount();

    // remount component
    wrapperA = mount(TestComponentA);
    wrapperB = mount(TestComponentB);
    expect(wrapperA.data).toBe('5');
    expect(wrapperB.data).toBe('5');
    await waitForTime(1000);
    expect(wrapperA.data).toBe('5');
    expect(wrapperB.data).toBe('5');
    for (let index = 0; index < 5; index++) {
      wrapperA.run();
      await waitForTime(1000);
    }
    expect(wrapperA.data).toBe('10');
    expect(wrapperB.data).toBe('10');
    wrapperA.unmount();
    wrapperB.unmount();
    // waiting for cache timeout
    waitForTime(10000);

    // remount component
    wrapperA = mount(TestComponentA);
    wrapperB = mount(TestComponentB);
    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
  });

  test('global custom cache should work', async () => {
    const store = {};
    const keyA = 'A';
    const keyB = 'B';
    let countA = 0;
    let countB = 0;
    const ComponentA = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: keyA,
        });
        return {
          run: () => run((countA += 1)),
          data,
        };
      },
    });
    const ComponentB = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: keyB,
        });
        return {
          run: () => run((countB += 2)),
          data,
        };
      },
    });

    setGlobalOptions({
      setCache: (key, data) => {
        store[key] = data;
      },
      getCache: key => store[key],
    });

    let wrapperA = mount(ComponentA);
    let wrapperB = mount(ComponentB);

    expect(store[keyA]).toBeUndefined();
    expect(store[keyB]).toBeUndefined();
    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();

    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');
    expect(store[keyA].data).toBe('success');
    expect(store[keyB].data).toBe('success');
    expect(store[keyA].params).toMatchObject([]);
    expect(store[keyB].params).toMatchObject([]);

    wrapperA.run();
    wrapperB.run();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('1');
    expect(wrapperB.data).toBe('2');

    expect(store[keyA].data).toBe('1');
    expect(store[keyB].data).toBe('2');

    expect(store[keyA].params).toMatchObject([1]);
    expect(store[keyB].params).toMatchObject([2]);

    wrapperA.unmount();
    wrapperB.unmount();

    expect(store[keyA].data).toBe('1');
    expect(store[keyB].data).toBe('2');

    expect(store[keyA].params).toMatchObject([1]);
    expect(store[keyB].params).toMatchObject([2]);

    wrapperA = mount(ComponentA);
    wrapperB = mount(ComponentB);
    expect(wrapperA.data).toBe('1');
    expect(wrapperB.data).toBe('2');

    expect(store[keyA].data).toBe('1');
    expect(store[keyB].data).toBe('2');

    expect(store[keyA].params).toMatchObject([1]);
    expect(store[keyB].params).toMatchObject([2]);

    wrapperA.run();
    wrapperB.run();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('2');
    expect(wrapperB.data).toBe('4');

    expect(store[keyA].data).toBe('2');
    expect(store[keyB].data).toBe('4');

    expect(store[keyA].params).toMatchObject([2]);
    expect(store[keyB].params).toMatchObject([4]);

    // clear global options
    clearGlobalOptions();
    wrapperA = mount(ComponentA);
    wrapperB = mount(ComponentB);

    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');
  });

  test('mutate data, cache should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run, mutate } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return {
          run: () => run((count += 1)),
          mutate: () => mutate('100'),
          data,
        };
      },
    });

    let wrapper = mount(TestComponent);
    expect(wrapper.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');
    for (let index = 0; index < 5; index++) {
      wrapper.run();
      await waitForTime(1000);
    }

    expect(wrapper.data).toBe('5');
    wrapper.mutate();
    expect(wrapper.data).toBe('100');
    wrapper.unmount();

    // remount component
    wrapper = mount(TestComponent);
    expect(wrapper.data).toBe('100');
  });

  test('when the request fails, data will not be cleared', async () => {
    let flag = true;
    const mixinRequest = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (flag) {
            resolve('success');
          } else {
            reject(new Error('fail'));
          }
        }, 1000);
      });
    };
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, error, data, run } = useRequest(mixinRequest);
          return {
            loading,
            error,
            data,
            run,
          };
        },
      }),
    );
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');

    // mock API error request
    flag = false;

    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');
    expect(wrapper.error?.message).toBe('fail');
  });

  test('errorRetry should work. case 1', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: 2,
            errorRetryInterval: 1000,
          });
          return {
            run,
            loading,
          };
        },
      }),
    );

    for (let oIndex = 0; oIndex < 10; oIndex++) {
      wrapper.run();
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);

      // retrying
      for (let index = 0; index < 2; index++) {
        await waitForTime(1000);
        expect(wrapper.loading).toBe(true);
        await waitForTime(1000);
        expect(wrapper.loading).toBe(false);
      }

      // stop retry
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }
  });

  test('errorRetry should work. case 2', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, cancel } = useRequest(failedRequest, {
            errorRetryCount: 3,
            errorRetryInterval: 1000,
          });
          return {
            cancel,
            loading,
          };
        },
      }),
    );
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    // first retry
    await waitForTime(1000);
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // second retry
    await waitForTime(1000);
    expect(wrapper.loading).toBe(true);

    // trigger cancel
    wrapper.cancel();
    expect(wrapper.loading).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('errorRetry should work. case 3', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: 10,
            onError: () => mockFn(),
          });
          return {
            run,
            loading,
          };
        },
      }),
    );

    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // retrying
    for (let index = 0; index < 10; index++) {
      await waitForAll();
      expect(wrapper.loading).toBe(false);
    }

    // stop retry
    await waitForAll();
    expect(wrapper.loading).toBe(false);
    expect(mockFn).toHaveBeenCalledTimes(11);
  });

  test('errorRetryCount should be reactive', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const errorRetryCount = ref(3);
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: errorRetryCount,
            errorRetryInterval: 1000,
            onError: () => mockFn(),
          });

          const changeCount = (number: number) => {
            errorRetryCount.value = number;
          };

          return {
            run,
            loading,
            changeCount,
          };
        },
      }),
    );

    wrapper.run();
    expect(wrapper.loading).toBe(true);

    await waitForAll();

    wrapper.changeCount(5); // change count
    await waitForTime(1);

    for (let index = 0; index < 10; index++) {
      await waitForAll();
    }
    expect(mockFn).toHaveBeenCalledTimes(6);

    // =========
    wrapper.run();
    expect(wrapper.loading).toBe(true);

    await waitForAll();

    wrapper.changeCount(2); // change count
    await waitForTime(1);

    for (let index = 0; index < 10; index++) {
      await waitForAll();
    }

    expect(mockFn).toHaveBeenCalledTimes(9);
  });

  test('errorRetryInterval should be reactive', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const errorRetryInterval = ref(1000);
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: 3,
            errorRetryInterval: errorRetryInterval,
          });

          const changeInterval = () => {
            errorRetryInterval.value = 500;
          };

          return {
            run,
            loading,
            changeInterval,
          };
        },
      }),
    );

    wrapper.run();
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // retrying 1
    await waitForTime(1000);
    expect(wrapper.loading).toBe(true);

    wrapper.changeInterval();
    await waitForTime(1);

    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // retrying 2
    await waitForTime(500);
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // retrying 3
    await waitForTime(500);
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);

    // stop retry
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('errorRetry should work with pollingInterval', async () => {
    let flag = true;
    const mixinRequest = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (flag) {
            resolve('success');
          } else {
            reject(new Error('fail'));
          }
        }, 1000);
      });
    };
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, error, data } = useRequest(mixinRequest, {
            errorRetryCount: 3,
            errorRetryInterval: 600,
            pollingInterval: 500,
          });
          return {
            loading,
            error,
            data,
          };
        },
      }),
    );

    // normal API request
    for (let index = 0; index < 1000; index++) {
      expect(wrapper.loading).toBe(true);
      if (index === 0) {
        expect(wrapper.data).toBeUndefined();
      } else {
        expect(wrapper.data).toBe('success');
      }
      await waitForTime(1000);
      expect(wrapper.data).toBe('success');
      expect(wrapper.error).toBeUndefined();
      await waitForTime(500);
    }

    // mock API error request
    flag = false;

    // retrying
    for (let index = 0; index < 3; index++) {
      expect(wrapper.loading).toBe(true);
      expect(wrapper.data).toBe('success');
      await waitForTime(1000);
      expect(wrapper.data).toBe('success');
      expect(wrapper.error?.message).toBe('fail');
      await waitForTime(600);
    }

    // stop retry
    expect(wrapper.loading).toBe(true);
    expect(wrapper.data).toBe('success');
    await waitForTime(1000);
    expect(wrapper.data).toBe('success');
    expect(wrapper.error?.message).toBe('fail');
    await waitForTime(600);
    expect(wrapper.data).toBe('success');
    expect(wrapper.error?.message).toBe('fail');
  });

  test('pollingInterval always receive a error request', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, error } = useRequest(failedRequest, {
            pollingInterval: 1000,
          });
          return {
            loading,
            error,
          };
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.error?.message).toBe('fail');
      await waitForTime(1000);
    }
  });

  test('pollingInterval always receive a error request and errorRetryCount is -1', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, error } = useRequest(failedRequest, {
            errorRetryCount: -1,
            pollingInterval: 500,
            errorRetryInterval: 600,
          });
          return {
            loading,
            error,
          };
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.error?.message).toBe('fail');
      await waitForTime(600);
    }
  });

  test('pollingInterval should be reactive', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const pollingInterval = ref(1000);
          const { loading } = useRequest(request, {
            pollingInterval: pollingInterval,
          });

          const changeInterval = (value: number) => {
            pollingInterval.value = value;
          };
          return {
            changeInterval,
            loading,
          };
        },
      }),
    );
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    // wait polling
    await waitForTime(1000);
    expect(wrapper.loading).toBe(true);

    wrapper.changeInterval(5000);
    await waitForTime(1);

    for (let index = 0; index < 10; index++) {
      await waitForTime(5000);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }

    await waitForTime(1000);
    wrapper.changeInterval(1000);
    await waitForTime(1);

    for (let index = 0; index < 10; index++) {
      await waitForTime(1000);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }
  });

  test('reset loadingDelay correctly when rerun or refresh', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, run, refresh } = useRequest(request, {
            loadingDelay: 500,
          });
          return {
            loading,
            run,
            refresh,
          };
        },
      }),
    );

    await waitForTime(300);
    expect(wrapper.loading).toBe(false);

    wrapper.run();
    await waitForTime(300);
    expect(wrapper.loading).toBe(false);
    await waitForTime(200);
    expect(wrapper.loading).toBe(true);

    wrapper.refresh();
    await waitForTime(300);
    expect(wrapper.loading).toBe(false);
    await waitForTime(200);
    expect(wrapper.loading).toBe(true);
  });

  test('reset polling correctly when rerun or refresh', async () => {
    enum RequestType {
      run,
      refresh,
      polling,
    }
    const requestTypeRef = ref<RequestType>(RequestType.run);

    const runCountRef = ref(0);
    const refreshCountRef = ref(0);
    const pollingCountRef = ref(0);

    const expectCount = (param: Ref<number>, value: number) => {
      expect(param.value).toBe(value);
    };

    const triggerWithCorrectType = (source: Function, type: RequestType) => {
      requestTypeRef.value = type;
      source();
    };
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, refresh } = useRequest(
            () => {
              switch (requestTypeRef.value) {
                case RequestType.polling:
                  pollingCountRef.value += 1;
                  break;
                case RequestType.run:
                  runCountRef.value += 1;
                  break;
                case RequestType.refresh:
                  refreshCountRef.value += 1;
                  break;
              }

              if (
                requestTypeRef.value === RequestType.run ||
                requestTypeRef.value === RequestType.refresh
              ) {
                requestTypeRef.value = RequestType.polling;
              }

              return request();
            },
            {
              pollingInterval: 500,
            },
          );
          return {
            run,
            refresh,
          };
        },
      }),
    );

    /* ------------------------------------- run ------------------------------------- */

    expectCount(runCountRef, 1);
    expectCount(pollingCountRef, 0);

    // auto run
    await waitForTime(1000);

    for (let index = 1; index <= 100; index++) {
      // wait for polling
      await waitForTime(500);

      // request complete
      await waitForTime(1000);
      expectCount(runCountRef, 1);
      expectCount(pollingCountRef, index);
    }

    // polling is pending
    await waitForTime(200);

    triggerWithCorrectType(wrapper.run, RequestType.run);
    await waitForTime(1000);

    expectCount(runCountRef, 2);
    expectCount(pollingCountRef, 100);

    for (let index = 1; index <= 100; index++) {
      // wait for polling
      await waitForTime(500);

      // request complete
      await waitForTime(1000);
      expectCount(pollingCountRef, index + 100);
    }

    /* ------------------------------------- refresh ------------------------------------- */
    expectCount(runCountRef, 2);
    expectCount(refreshCountRef, 0);
    expectCount(pollingCountRef, 200);

    // polling is pending
    await waitForTime(200);

    triggerWithCorrectType(wrapper.refresh, RequestType.refresh);

    expectCount(refreshCountRef, 1);
    expectCount(pollingCountRef, 200);

    // refresh complete
    await waitForTime(1000);

    for (let index = 1; index <= 100; index++) {
      // wait for polling
      await waitForTime(500);

      // request complete
      await waitForTime(1000);
      expectCount(pollingCountRef, index + 200);
    }

    expectCount(runCountRef, 2);
    expectCount(refreshCountRef, 1);
    expectCount(pollingCountRef, 300);
  });

  test('reset error retry correctly when rerun or refresh', async () => {
    enum RequestType {
      run,
      refresh,
      errorRetry,
    }
    const requestTypeRef = ref<RequestType>(RequestType.run);

    const runCountRef = ref(0);
    const refreshCountRef = ref(0);
    const errorRetryCountRef = ref(0);

    const expectCount = (param: Ref<number>, value: number) => {
      expect(param.value).toBe(value);
    };

    const triggerWithCorrectType = (source: Function, type: RequestType) => {
      requestTypeRef.value = type;
      source();
    };

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { run, refresh, error } = useRequest(
            () => {
              switch (requestTypeRef.value) {
                case RequestType.errorRetry:
                  errorRetryCountRef.value += 1;
                  break;
                case RequestType.run:
                  runCountRef.value += 1;
                  break;
                case RequestType.refresh:
                  refreshCountRef.value += 1;
                  break;
              }

              if (
                requestTypeRef.value === RequestType.run ||
                requestTypeRef.value === RequestType.refresh
              ) {
                requestTypeRef.value = RequestType.errorRetry;
              }

              return failedRequest();
            },
            {
              errorRetryCount: 5,
              errorRetryInterval: 500,
            },
          );
          return {
            error,
            run,
            refresh,
          };
        },
      }),
    );

    /* ------------------------------------- run ------------------------------------- */
    expectCount(runCountRef, 1);
    expectCount(errorRetryCountRef, 0);
    expect(wrapper.error).toBeUndefined();

    // wait for request
    await waitForTime(1000);

    // receive a error result
    expect(wrapper.error).not.toBeUndefined();
    // wait for error retry
    await waitForTime(500);

    expectCount(runCountRef, 1);
    expectCount(errorRetryCountRef, 1);

    await waitForTime(1000);
    // error retry is pending
    await waitForTime(300);

    triggerWithCorrectType(wrapper.run, RequestType.run);
    expectCount(runCountRef, 2);
    expectCount(errorRetryCountRef, 1);

    await waitForTime(1000);
    await waitForTime(500);

    expectCount(runCountRef, 2);
    expectCount(errorRetryCountRef, 2);

    /* ------------------------------------- refresh ------------------------------------- */
    await waitForTime(1000);

    expectCount(runCountRef, 2);
    expectCount(errorRetryCountRef, 2);

    triggerWithCorrectType(wrapper.refresh, RequestType.refresh);
    expectCount(refreshCountRef, 1);
    expectCount(errorRetryCountRef, 2);

    await waitForTime(1000);
    await waitForTime(500);

    expectCount(refreshCountRef, 1);
    expectCount(errorRetryCountRef, 3);

    await waitForTime(1000);
    // error retry is pending
    await waitForTime(300);

    triggerWithCorrectType(wrapper.refresh, RequestType.refresh);
    expectCount(refreshCountRef, 2);
    expectCount(errorRetryCountRef, 3);

    // receive a error result
    await waitForTime(1000);

    // start error retry
    for (let index = 0; index < 100; index++) {
      await waitForTime(1000);
      await waitForTime(500);
    }

    expectCount(runCountRef, 2);
    expectCount(refreshCountRef, 2);
    // 5 times is the retry count
    expectCount(errorRetryCountRef, 3 + 5);
  });

  test('pollingWhenOffline should work. case 1', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return {
            loading,
            data,
          };
        },
      }),
    );

    for (let index = 0; index < 50; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.data).toBe(`51`);
    await waitForTime(500);
    expect(wrapper.data).toBe(`51`);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    await waitForTime(1);

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${51 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('pollingWhenOffline should work. case 2', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
            pollingWhenOffline: true,
          });
          return {
            loading,
            data,
          };
        },
      }),
    );

    for (let index = 0; index < 50; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.data).toBe(`51`);
    await waitForTime(500);
    expect(wrapper.loading).toBe(true);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    await waitForTime(1);

    for (let index = 0; index < 100; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${51 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('pollingWhenOffline should work with pollingWhenHidden', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return {
            loading,
            data,
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.loading).toBe(true);
    await waitForTime(1000);
    expect(wrapper.data).toBe(`101`);
    await waitForTime(500);
    expect(wrapper.data).toBe(`101`);

    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    // wait 1ms make to sure event has trigger
    await waitForTime(1);
    expect(wrapper.data).toBe(`101`);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    // wait 1ms to make sure event has trigger
    await waitForTime(1);

    for (let index = 0; index < 50; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${101 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('listener should unsubscribe when the component was unmounted', async () => {
    let count = 0;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return {
            loading,
            data,
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.data).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    expect(RECONNECT_LISTENER.size).toBe(1);
    wrapper.unmount();
    expect(RECONNECT_LISTENER.size).toBe(0);
  });

  test('global options should work', async () => {
    const ComponentA = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request);
        return {
          run,
          data,
        };
      },
    });
    const ComponentB = defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(request);
        return {
          run,
          data,
        };
      },
    });

    setGlobalOptions({ manual: true });
    let wrapperA = mount(ComponentA);
    let wrapperB = mount(ComponentB);

    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
    wrapperA.run();
    wrapperB.run();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');

    wrapperA.unmount();
    wrapperB.unmount();

    // clear global options
    clearGlobalOptions();
    wrapperA = mount(ComponentA);
    wrapperB = mount(ComponentB);

    expect(wrapperA.data).toBeUndefined();
    expect(wrapperB.data).toBeUndefined();
    await waitForTime(1000);
    expect(wrapperA.data).toBe('success');
    expect(wrapperB.data).toBe('success');
  });

  // test('RequestConfig should work', async () => {
  //   const createComponent = (id: string, requestOptions: GlobalOptions = {}) =>
  //     defineComponent({
  //       setup() {
  //         const { loading, run } = useRequest(request, requestOptions);

  //         return () => (
  //           <button id={id} onClick={run}>
  //             {`${loading.value}`}
  //           </button>
  //         );
  //       },
  //     });

  //   const ComponentA = createComponent('A');
  //   const ComponentB = createComponent('B');
  //   const ComponentC = createComponent('C');
  //   const ComponentD = createComponent('D');
  //   const ComponentE = createComponent('E', { loadingDelay: 800 });

  //   setGlobalOptions({
  //     manual: true,
  //     loadingDelay: 500,
  //   });

  //   const Wrapper = defineComponent({
  //     render() {
  //       return () => (
  //         <div id="root">
  //           <RequestConfig config={{ loadingDelay: 0 }}>
  //             <ComponentA />
  //           </RequestConfig>

  //           <RequestConfig config={{ manual: false }}>
  //             <ComponentB />

  //             <ComponentE />

  //             {/* nested */}
  //             <RequestConfig config={{ manual: true, loadingDelay: 200 }}>
  //               <ComponentC />
  //             </RequestConfig>
  //           </RequestConfig>

  //           <ComponentD />
  //         </div>
  //       );
  //     },
  //   });

  //   const wrapperA = mount(Wrapper);

  //   expect(wrapperA.find('#A').text()).toBe('false');
  //   expect(wrapperA.find('#B').text()).toBe('false');
  //   expect(wrapperA.find('#C').text()).toBe('false');
  //   expect(wrapperA.find('#D').text()).toBe('false');
  //   expect(wrapperA.find('#E').text()).toBe('false');

  //   await wrapperA.find('#A').trigger('click');
  //   await wrapperA.find('#C').trigger('click');
  //   await wrapperA.find('#D').trigger('click');

  //   expect(wrapperA.find('#A').text()).toBe('true');
  //   expect(wrapperA.find('#B').text()).toBe('false');
  //   expect(wrapperA.find('#C').text()).toBe('false');
  //   expect(wrapperA.find('#D').text()).toBe('false');
  //   expect(wrapperA.find('#E').text()).toBe('false');

  //   await waitForTime(200);

  //   expect(wrapperA.find('#A').text()).toBe('true');
  //   expect(wrapperA.find('#B').text()).toBe('false');
  //   expect(wrapperA.find('#C').text()).toBe('true');
  //   expect(wrapperA.find('#D').text()).toBe('false');
  //   expect(wrapperA.find('#E').text()).toBe('false');

  //   await waitForTime(300);

  //   expect(wrapperA.find('#A').text()).toBe('true');
  //   expect(wrapperA.find('#B').text()).toBe('true');
  //   expect(wrapperA.find('#C').text()).toBe('true');
  //   expect(wrapperA.find('#D').text()).toBe('true');
  //   expect(wrapperA.find('#E').text()).toBe('false');

  //   await waitForTime(300);

  //   expect(wrapperA.find('#A').text()).toBe('true');
  //   expect(wrapperA.find('#B').text()).toBe('true');
  //   expect(wrapperA.find('#C').text()).toBe('true');
  //   expect(wrapperA.find('#D').text()).toBe('true');
  //   expect(wrapperA.find('#E').text()).toBe('true');

  //   await waitForTime(200);

  //   expect(wrapperA.find('#A').text()).toBe('false');
  //   expect(wrapperA.find('#B').text()).toBe('false');
  //   expect(wrapperA.find('#C').text()).toBe('false');
  //   expect(wrapperA.find('#D').text()).toBe('false');
  //   expect(wrapperA.find('#E').text()).toBe('false');

  //   wrapperA.unmount();

  //   // clear global options
  //   clearGlobalOptions();
  //   const wrapperB = mount(Wrapper);

  //   expect(wrapperB.find('#A').text()).toBe('true');
  //   expect(wrapperB.find('#B').text()).toBe('true');
  //   expect(wrapperB.find('#C').text()).toBe('false');
  //   expect(wrapperB.find('#D').text()).toBe('true');
  //   expect(wrapperB.find('#E').text()).toBe('false');

  //   await wrapperB.find('#C').trigger('click');

  //   await waitForTime(200);

  //   expect(wrapperB.find('#A').text()).toBe('true');
  //   expect(wrapperB.find('#B').text()).toBe('true');
  //   expect(wrapperB.find('#C').text()).toBe('true');
  //   expect(wrapperB.find('#D').text()).toBe('true');
  //   expect(wrapperB.find('#E').text()).toBe('false');

  //   await waitForTime(600);

  //   expect(wrapperB.find('#A').text()).toBe('true');
  //   expect(wrapperB.find('#B').text()).toBe('true');
  //   expect(wrapperB.find('#C').text()).toBe('true');
  //   expect(wrapperB.find('#D').text()).toBe('true');
  //   expect(wrapperB.find('#E').text()).toBe('true');

  //   await waitForTime(200);

  //   expect(wrapperB.find('#A').text()).toBe('false');
  //   expect(wrapperB.find('#B').text()).toBe('false');
  //   expect(wrapperB.find('#C').text()).toBe('false');
  //   expect(wrapperB.find('#D').text()).toBe('false');
  //   expect(wrapperB.find('#E').text()).toBe('false');
  // });

  // test('reload should work: case 1', async () => {
  //   const wrapper = mount(
  //     defineComponent({
  //       template: '<div/>',
  //       setup() {
  //         const { run, reload, reloading, data } = useRequest(request, {
  //           defaultParams: ['hello'],
  //         });
  //         return { reloading, data, run, reload };
  //       },
  //     }),
  //   );

  //   expect(wrapper.reloading).toBe(false);
  //   await waitForTime(1000);
  //   expect(wrapper.reloading).toBe(false);
  //   expect(wrapper.data).toBe('hello');

  //   wrapper.run('hi there');
  //   expect(wrapper.reloading).toBe(false);
  //   await waitForTime(1000);
  //   expect(wrapper.reloading).toBe(false);
  //   expect(wrapper.data).toEqual('hi there');

  //   wrapper.reload();
  //   expect(wrapper.reloading).toBe(true);
  //   await waitForTime(1000);
  //   expect(wrapper.reloading).toBe(false);
  //   expect(wrapper.data).toEqual('hello');

  //   wrapper.run('hi there');
  //   expect(wrapper.reloading).toBe(false);
  //   await waitForTime(1000);
  //   expect(wrapper.reloading).toBe(false);
  //   expect(wrapper.data).toEqual('hi there');
  // });

  test('onBefore and onAfter hooks can use', async () => {
    const onBefore = jest.fn();
    const onAfter = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, run } = useRequest(request, {
            onBefore,
            onAfter,
          });

          return {
            run,
            data,
          };
        },
      }),
    );
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(100);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(800);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(100);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(1);
  });
});
