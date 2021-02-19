import { mount, shallowMount } from '@vue/test-utils';
import fetchMock from 'fetch-mock';
import { defineComponent, reactive, Ref, ref } from 'vue';
import {
  clearGlobalOptions,
  GlobalOptions,
  setGlobalOptions,
} from '../core/config';
import { clearCache } from '../core/utils/cache';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { useRequest, RequestConfig } from '../index';
import { waitForAll, waitForTime } from './utils';
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
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(request);

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
  });

  test('can be manually triggered', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run } = useRequest(request, { manual: true });

          return () => (
            <button onClick={() => run()}>{`data:${data.value}`}</button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
  });

  test('params should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run, params } = useRequest(request, {
            defaultParams: ['hello', 'world'],
          });
          return () => (
            <button onClick={() => run('hi there')}>
              {params.value?.join(',')}
            </button>
          );
        },
      }),
    );

    await waitForTime(1000);
    expect(wrapper.text()).toBe('hello,world');
    await wrapper.find('button').trigger('click');
    await waitForTime(1000);
    expect(wrapper.text()).toEqual('hi there');
  });

  test('defaultParams should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(request, {
            defaultParams: ['hello', 'world'],
          });

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:hello,world');
  });

  test('run can be accept params', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run } = useRequest(request);

          return () => (
            <button onClick={() => run('hello', 'world')}>
              {`data:${data.value}`}
            </button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:hello,world');
  });

  test('mutate should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, mutate } = useRequest(request);

          return () => (
            <button onClick={() => mutate('ok')}>{`data:${data.value}`}</button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('data:ok');
  });

  test('mutate callback should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, mutate } = useRequest(request);

          return () => (
            <button onClick={() => mutate(() => 'ok')}>
              {`data:${data.value}`}
            </button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('data:ok');
  });

  test('refresh should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { refresh, loading } = useRequest(request);

          return () => (
            <button onClick={() => refresh()}>
              {`loading:${loading.value}`}
            </button>
          );
        },
      }),
    );
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
  });

  test('log request error by default', async () => {
    console.error = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run } = useRequest(failedRequest, { manual: true });
          const handleClick = () => run();
          return () => <button onClick={handleClick}></button>;
        },
      }),
    );
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(console.error).toHaveBeenCalledWith(new Error('fail'));
  });

  test('onSuccess should work', async () => {
    const mockSuccessCallback = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run } = useRequest(request, {
            manual: true,
            onSuccess: mockSuccessCallback,
          });
          const handleClick = () => run();
          return () => <button onClick={handleClick}></button>;
        },
      }),
    );
    await wrapper.find('button').trigger('click');

    await waitForAll();
    expect(mockSuccessCallback).toHaveBeenCalledWith('success', []);
  });

  test('onError should work', async () => {
    const mockErrorCallback = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run } = useRequest(failedRequest, {
            manual: true,
            onError: mockErrorCallback,
          });
          const handleClick = () => run();
          return () => <button onClick={handleClick}></button>;
        },
      }),
    );
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(mockErrorCallback).toHaveBeenCalledWith(new Error('fail'), []);
  });

  test('initData should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(request, {
            initialData: 'init',
          });

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );
    expect(wrapper.vm.$el.textContent).toBe('data:init');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
  });

  test('ready should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const readyRef = ref(false);

          const { data } = useRequest(request, {
            ready: readyRef,
          });

          return () => (
            <button
              onClick={() => {
                readyRef.value = true;
              }}
            >
              {`data:${data.value}`}
            </button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
  });

  test('ready should save the first time request params : case 1', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const readyRef = ref(false);
          const { data, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
          });

          return () => (
            <div>
              <button id="run" onClick={() => run('run')} />
              <button
                id="ready"
                onClick={() => {
                  readyRef.value = true;
                }}
              />
              <span id="text">{`data:${data.value}`}</span>
            </div>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.find('#text').text()).toBe('data:undefined');
    await wrapper.find('#ready').trigger('click');
    await waitForAll();
    expect(wrapper.find('#text').text()).toBe('data:default');
    await wrapper.find('#run').trigger('click');
    await waitForAll();
    expect(wrapper.find('#text').text()).toBe('data:run');
  });

  test('ready should save the first time request params : case 2', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const readyRef = ref(false);
          const { data, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: ['default'],
          });

          return () => (
            <div>
              <button id="run" onClick={() => run('run')} />
              <button
                id="ready"
                onClick={() => {
                  readyRef.value = true;
                }}
              />
              <span id="text">{`data:${data.value}`}</span>
            </div>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.find('#text').text()).toBe('data:undefined');
    await wrapper.find('#run').trigger('click');
    await wrapper.find('#ready').trigger('click');
    await waitForAll();
    expect(wrapper.find('#text').text()).toBe('data:run');
  });

  test('track ready when ready initial value is false', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const readyRef = ref(true);
          const count = ref(0);
          const { data, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: [count.value],
          });

          return () => (
            <button
              onClick={() => {
                readyRef.value = !readyRef.value;
                count.value += 1;
                run(count.value);
              }}
            >
              {`data:${data.value}`}
            </button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:0');
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:1');
  });

  test('ready should work only once', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const readyRef = ref(false);
          const count = ref(0);
          const { data, run } = useRequest(request, {
            ready: readyRef,
            defaultParams: [count.value],
          });

          return () => (
            <button
              onClick={async () => {
                readyRef.value = !readyRef.value;
                count.value += 1;
                run(count.value);
              }}
            >
              {`data:${data.value}`}
            </button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await wrapper.find('button').trigger('click');
    // first click
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:1');
    await wrapper.find('button').trigger('click');
    // second click
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:2');
  });

  test('formatResult should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(request, {
            formatResult: () => 'formatted',
          });

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );
    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:formatted');
  });

  test('refreshDeps should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const refreshRef = ref(0);
          const refreshReactive = reactive({
            count: 0,
          });
          const { loading } = useRequest(request, {
            refreshDeps: [refreshRef, () => refreshReactive.count],
          });

          return () => (
            <div>
              <div id="data">{String(loading.value)}</div>
              <button
                id="ref"
                onClick={() => {
                  refreshRef.value++;
                }}
              />
              <button
                id="reactive"
                onClick={() => {
                  refreshReactive.count++;
                }}
              />
            </div>
          );
        },
      }),
    );

    await waitForTime(1000);
    expect(wrapper.find('#data').text()).toBe('false');

    for (let index = 0; index < 100; index++) {
      await wrapper.find('#ref').trigger('click');
      expect(wrapper.find('#data').text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.find('#data').text()).toBe('false');
    }

    for (let index = 0; index < 100; index++) {
      await wrapper.find('#reactive').trigger('click');
      expect(wrapper.find('#data').text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.find('#data').text()).toBe('false');
    }
  });

  test('loadingDelay should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading } = useRequest(request, {
            loadingDelay: 800,
          });

          return () => <button>{`loading:${loading.value}`}</button>;
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await waitForTime(800);
    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForTime(200);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
  });

  test('cancel loadingDelay should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, cancel } = useRequest(request, {
            loadingDelay: 800,
          });

          return () => (
            <button onClick={() => cancel()}>
              {`loading:${loading.value}`}
            </button>
          );
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await waitForTime(800);
    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
  });

  test('cancel should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { cancel, data, run } = useRequest(request);

          return () => (
            <div>
              <button onClick={() => cancel()} id="cancel" />
              <button onClick={() => run()} id="run" />
              <span id="data">{`data:${data.value}`}</span>
            </div>
          );
        },
      }),
    );

    expect(wrapper.find('#data').text()).toBe('data:undefined');
    await wrapper.find('#cancel').trigger('click');
    await waitForAll();
    expect(wrapper.find('#data').text()).toBe('data:undefined');
    await wrapper.find('#run').trigger('click');
    await waitForAll();
    expect(wrapper.find('#data').text()).toBe('data:success');
  });

  test('cancel should work when request error', async () => {
    console.error = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run, cancel } = useRequest(failedRequest, {
            manual: true,
          });
          return () => (
            <div>
              <button id="run" onClick={() => run().catch(() => {})}></button>;
              <button id="cancel" onClick={() => cancel()}></button>;
              <span id="data">{`data:${data.value}`}</span>
            </div>
          );
        },
      }),
    );
    expect(wrapper.find('#data').text()).toBe('data:undefined');
    await wrapper.find('#run').trigger('click');
    await waitForTime(200);
    await wrapper.find('#cancel').trigger('click');
    await waitForAll();
    expect(wrapper.find('#data').text()).toBe('data:undefined');
    await wrapper.find('#run').trigger('click');
    await waitForAll();
    expect(console.error).toHaveBeenCalledWith(new Error('fail'));
  });

  test('pollingInterval should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, cancel } = useRequest(request, {
            pollingInterval: 500,
          });

          return () => (
            <button onClick={() => cancel()}>
              {`loading:${loading.value}`}
            </button>
          );
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await waitForTime(500);
    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await wrapper.find('button').trigger('click');
    waitForTime(600);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
  });

  test('pollingInterval less than 0 should not work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, cancel } = useRequest(request, {
            pollingInterval: -0.1,
          });

          return () => (
            <button onClick={() => cancel()}>
              {`loading:${loading.value}`}
            </button>
          );
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await waitForTime(10);
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
  });

  test('pollingWhenHidden be false should work', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(() => request((count += 1)), {
            pollingInterval: 1000,
            pollingWhenHidden: false,
          });

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:1');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:2');
    // mock tab hide
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:4');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:5');
  });

  test('pollingWhenHidden be true should work', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data } = useRequest(() => request((count += 1)), {
            pollingInterval: 1000,
            pollingWhenHidden: true,
          });

          return () => <button>{`data:${data.value}`}</button>;
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:1');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:2');
    // mock tab hide
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:4');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    // because pollingWhenHidden is true, so refresh never trigger
    expect(wrapper.vm.$el.textContent).toBe('data:4');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:5');
  });

  test('refreshOnWindowFocus should work', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run } = useRequest(() => request((count += 1)), {
            refreshOnWindowFocus: true,
          });

          return () => (
            <button onClick={() => run()}>{`data:${data.value}`}</button>
          );
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:1');
    await wrapper.find('button').trigger('click');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:2');
    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    // wait for 5s
    await waitForTime(4000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:4');
  });

  test('refocusTimespan should work', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run } = useRequest(() => request((count += 1)), {
            refreshOnWindowFocus: true,
            refocusTimespan: 3000,
          });

          return () => (
            <button onClick={() => run()}>{`data:${data.value}`}</button>
          );
        },
      }),
    );

    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:1');
    await wrapper.find('button').trigger('click');
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:2');
    // mock tab visible
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    // wait for 3s
    await waitForTime(2000);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    await waitForTime(1000);
    expect(wrapper.vm.$el.textContent).toBe('data:4');
  });

  test('debounceInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
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
          return () => <button onClick={() => run()} />;
        },
      }),
    );
    for (let index = 0; index < 100; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('debounceInterval should work with cancel', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button id="run" onClick={() => run()} />
              <button id="cancel" onClick={() => cancel()} />
            </div>
          );
        },
      }),
    );
    const run = () => wrapper.find('#run').trigger('click');
    const cancel = () => wrapper.find('#cancel').trigger('click');
    for (let index = 0; index < 100; index++) {
      await run();
      await waitForTime(50);
    }
    await cancel();
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);

    for (let index = 0; index < 100; index++) {
      await run();
      await waitForTime(50);
    }

    await cancel();
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  test('initial auto run should skip debounce', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
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
          return () => <button onClick={() => run()} />;
        },
      }),
    );
    expect(mockFn).toHaveBeenCalledTimes(1);

    await wrapper.find('button').trigger('click');
    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
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
          return () => <button onClick={() => run()} />;
        },
      }),
    );

    await wrapper.find('button').trigger('click');

    await waitForTime(50);
    await wrapper.find('button').trigger('click');

    await waitForTime(50);
    await wrapper.find('button').trigger('click');

    await waitForAll();
    // have been call 3 times
    // because the function will invoking on the leading edge and trailing edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('throttleInterval should work with cancel', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button id="run" onClick={() => run()} />
              <button id="cancel" onClick={() => cancel()} />
            </div>
          );
        },
      }),
    );
    const run = () => wrapper.find('#run').trigger('click');
    const cancel = () => wrapper.find('#cancel').trigger('click');
    await run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(1);
    await waitForTime(10);
    await cancel();

    await run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(2);
    await waitForTime(10);
    await cancel();

    await run();
    // trigger by leading
    expect(mockFn).toHaveBeenCalledTimes(3);
    await waitForTime(50);
    await run();
    await run();

    await waitForAll();
    // trigger by trailing
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  test('cache should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return () => (
          <button onClick={() => run((count += 1))}>{data.value}</button>
        );
      },
    });

    let wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('success');
    for (let index = 0; index < 5; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(1000);
    }
    expect(wrapper.find('button').text()).toBe('5');
    wrapper.unmount();

    // remount component
    wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('5');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('5');
    for (let index = 0; index < 5; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(1000);
    }
    expect(wrapper.find('button').text()).toBe('10');
    wrapper.unmount();
    // waiting for cache timeout
    waitForTime(10000);

    // remount component
    wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('');
  });

  test('cache staleTime should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          staleTime: 5000,
        });
        return () => (
          <button onClick={() => run((count += 1))}>{data.value}</button>
        );
      },
    });
    let wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('success');
    for (let index = 0; index < 5; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(1000);
    }
    expect(wrapper.find('button').text()).toBe('5');
    wrapper.unmount();

    // remount component
    wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('5');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('5');
    for (let index = 0; index < 5; index++) {
      await wrapper.find('button').trigger('click');
      await waitForTime(1000);
    }
    expect(wrapper.find('button').text()).toBe('10');
    wrapper.unmount();
    // waiting for stale timeout
    jest.setSystemTime(new Date().getTime() + 5000);

    // remount component
    wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('10');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('10');
  });

  test('queryKey should work : case 1', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          // auto run with empty params
          const { loading, params, data } = useRequest(request, {
            queryKey: id => id,
          });
          return () => (
            <div>
              <div id="loading">{`${loading.value}`}</div>
              <div id="data">{`${data.value}`}</div>
              <div id="params">{`${params.value.length}`}</div>
            </div>
          );
        },
      }),
    );

    expect(wrapper.find('#loading').text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.find('#loading').text()).toBe('false');
    expect(wrapper.find('#data').text()).toBe('success');
    expect(wrapper.find('#params').text()).toBe('0');
  });

  test('queryKey should work : case 2', async () => {
    const users = [
      { id: '1', username: 'A' },
      { id: '2', username: 'B' },
      { id: '3', username: 'C' },
    ];

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run, queries, data, loading } = useRequest(request, {
            manual: true,
            queryKey: id => id,
          });

          return () => (
            <div>
              <div id="data">{data.value}</div>
              <div id="loading">{loading.value.toString()}</div>
              <ul>
                {users.map(item => (
                  <li
                    key={item.id}
                    id={item.username}
                    onClick={() => run(item.id)}
                  >
                    {queries[item.id]?.loading.value
                      ? 'loading'
                      : item.username}
                  </li>
                ))}
              </ul>
            </div>
          );
        },
      }),
    );

    for (let i = 0; i < users.length; i++) {
      const userName = users[i].username;
      const currentId = users[i].id;

      await wrapper.find(`#${userName}`).trigger('click');
      expect(wrapper.find(`#${userName}`).text()).toBe('loading');

      expect(wrapper.find('#data').text()).toBe('');
      expect(wrapper.find('#loading').text()).toBe('true');

      await waitForTime(1000);
      expect(wrapper.find(`#${userName}`).text()).toBe(userName);

      expect(wrapper.find('#data').text()).toBe(currentId);
      expect(wrapper.find('#loading').text()).toBe('false');
    }
  });

  test('queryKey should work : case 3', async () => {
    // swr
    const users = [
      { id: '1', username: 'A' },
      { id: '2', username: 'B' },
      { id: '3', username: 'C' },
    ];

    const Child = defineComponent({
      setup() {
        const { run, queries } = useRequest(request, {
          queryKey: id => id,
          cacheKey: 'users',
        });

        return () => (
          <div>
            <ul id="child">
              {users.map(item => (
                <li
                  key={item.id}
                  id={item.username}
                  onClick={() => run(item.id)}
                >
                  {queries[item.id]?.loading.value ? 'loading' : item.username}
                </li>
              ))}
            </ul>
          </div>
        );
      },
    });

    const Parent = mount(
      defineComponent({
        props: {
          show: {
            type: Boolean,
            default: false,
          },
        },
        setup(props) {
          return () => <div>{props.show && <Child />}</div>;
        },
      }),
    );

    await Parent.setProps({
      show: true,
    });

    for (let i = 0; i < users.length; i++) {
      const userName = users[i].username;

      await Parent.find(`#${userName}`).trigger('click');
      expect(Parent.find(`#${userName}`).text()).toBe('loading');
      await waitForTime(1000);
      expect(Parent.find(`#${userName}`).text()).toBe(userName);
    }

    // unmount Child
    await Parent.setProps({
      show: false,
    });

    // remount Child
    await Parent.setProps({
      show: true,
    });

    // all queries will auto refresh
    for (let i = 0; i < users.length; i++) {
      const userName = users[i].username;

      expect(Parent.find(`#${userName}`).text()).toBe('loading');
    }

    await waitForTime(1000);

    for (let i = 0; i < users.length; i++) {
      const userName = users[i].username;

      expect(Parent.find(`#${userName}`).text()).toBe(userName);
    }
  });

  test('errorRetry should work. case 1', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: 2,
            errorRetryInterval: 1000,
          });
          const handleClick = () => run();
          return () => (
            <button onClick={handleClick}>{`${loading.value}`}</button>
          );
        },
      }),
    );

    for (let oIndex = 0; oIndex < 10; oIndex++) {
      await wrapper.find('button').trigger('click');
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe('false');

      // retrying
      for (let index = 0; index < 2; index++) {
        await waitForTime(1000);
        expect(wrapper.text()).toBe('true');
        await waitForTime(1000);
        expect(wrapper.text()).toBe('false');
      }

      // stop retry
      await waitForTime(1000);
      expect(wrapper.text()).toBe('false');
    }
  });

  test('errorRetry should work. case 2', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, cancel } = useRequest(failedRequest, {
            errorRetryCount: 3,
            errorRetryInterval: 1000,
          });
          return () => (
            <button onClick={() => cancel()}>{`${loading.value}`}</button>
          );
        },
      }),
    );
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe('false');
    // first retry
    await waitForTime(1000);
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe('false');

    // second retry
    await waitForTime(1000);
    expect(wrapper.text()).toBe('true');

    // trigger cancel
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toBe('false');
    await waitForTime(1000);
    expect(wrapper.text()).toBe('false');
  });

  test('errorRetry should work. case 3', async () => {
    const mockFn = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run, loading } = useRequest(failedRequest, {
            manual: true,
            errorRetryCount: 10,
            onError: () => mockFn(),
          });
          const handleClick = () => run();
          return () => (
            <button onClick={handleClick}>{`${loading.value}`}</button>
          );
        },
      }),
    );

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe('false');

    // retrying
    for (let index = 0; index < 10; index++) {
      await waitForAll();
      expect(wrapper.text()).toBe('false');
    }

    // stop retry
    await waitForAll();
    expect(wrapper.text()).toBe('false');
    expect(mockFn).toHaveBeenCalledTimes(11);
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
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, error, data } = useRequest(mixinRequest, {
            errorRetryCount: 3,
            errorRetryInterval: 600,
            pollingInterval: 500,
          });
          return () => (
            <button>
              {`${loading.value || data.value || error.value?.message}`}
            </button>
          );
        },
      }),
    );

    // normal API request
    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe('success');
      await waitForTime(500);
    }

    // mock API error request
    flag = false;

    // retrying
    for (let index = 0; index < 3; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe('fail');
      await waitForTime(600);
    }

    // stop retry
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe('fail');
    await waitForTime(600);
    expect(wrapper.text()).toBe('fail');
  });

  test('pollingInterval always receive a error request', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, error } = useRequest(failedRequest, {
            pollingInterval: 1000,
          });
          return () => (
            <button>{`${loading.value || error.value?.message}`}</button>
          );
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe('fail');
      await waitForTime(1000);
    }
  });

  test('pollingInterval always receive a error request and errorRetryCount is -1', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, error } = useRequest(failedRequest, {
            errorRetryCount: -1,
            pollingInterval: 500,
            errorRetryInterval: 600,
          });
          return () => (
            <button>{`${loading.value || error.value?.message}`}</button>
          );
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe('fail');
      await waitForTime(600);
    }
  });

  test('reset loadingDelay correctly when rerun or refresh', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, run, refresh } = useRequest(request, {
            loadingDelay: 500,
          });
          return () => (
            <div>
              <div id="loading">{`${loading.value}`}</div>
              <button
                id="run"
                onClick={() => {
                  run();
                }}
              />
              <button
                id="refresh"
                onClick={() => {
                  refresh();
                }}
              />
            </div>
          );
        },
      }),
    );
    const loadingRes = () => wrapper.find('#loading').text();
    const run = () => wrapper.find('#run').trigger('click');
    const refresh = () => wrapper.find('#refresh').trigger('click');
    await waitForTime(300);
    expect(loadingRes()).toBe('false');

    run();
    await waitForTime(300);
    expect(loadingRes()).toBe('false');
    await waitForTime(200);
    expect(loadingRes()).toBe('true');

    refresh();
    await waitForTime(300);
    expect(loadingRes()).toBe('false');
    await waitForTime(200);
    expect(loadingRes()).toBe('true');
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
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button
                id="run"
                onClick={() => {
                  run();
                }}
              />
              <button
                id="refresh"
                onClick={() => {
                  refresh();
                }}
              />
            </div>
          );
        },
      }),
    );

    const run = () => wrapper.find('#run').trigger('click');
    const refresh = () => wrapper.find('#refresh').trigger('click');
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

    triggerWithCorrectType(run, RequestType.run);
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

    triggerWithCorrectType(refresh, RequestType.refresh);

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

    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <div id="error">{`${error.value?.message}`}</div>
              <button
                id="run"
                onClick={() => {
                  run();
                }}
              />
              <button
                id="refresh"
                onClick={() => {
                  refresh();
                }}
              />
            </div>
          );
        },
      }),
    );
    const errorRes = () => wrapper.find('#error').text();
    const run = () => wrapper.find('#run').trigger('click');
    const refresh = () => wrapper.find('#refresh').trigger('click');
    /* ------------------------------------- run ------------------------------------- */
    expectCount(runCountRef, 1);
    expectCount(errorRetryCountRef, 0);
    expect(errorRes()).toBe('undefined');

    // wait for request
    await waitForTime(1000);

    // receive a error result
    expect(errorRes()).not.toBe('undefined');
    // wait for error retry
    await waitForTime(500);

    expectCount(runCountRef, 1);
    expectCount(errorRetryCountRef, 1);

    await waitForTime(1000);
    // error retry is pending
    await waitForTime(300);

    triggerWithCorrectType(run, RequestType.run);
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

    triggerWithCorrectType(refresh, RequestType.refresh);
    expectCount(refreshCountRef, 1);
    expectCount(errorRetryCountRef, 2);

    await waitForTime(1000);
    await waitForTime(500);

    expectCount(refreshCountRef, 1);
    expectCount(errorRetryCountRef, 3);

    await waitForTime(1000);
    // error retry is pending
    await waitForTime(300);

    triggerWithCorrectType(refresh, RequestType.refresh);
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
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return () => <button>{`${loading.value || data.value}`}</button>;
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe(`1001`);
    await waitForTime(500);
    expect(wrapper.text()).toBe(`1001`);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    await waitForTime(1);

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${1001 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('pollingWhenOffline should work. case 2', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
            pollingWhenOffline: true,
          });
          return () => <button>{`${loading.value || data.value}`}</button>;
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe(`1001`);
    await waitForTime(500);
    expect(wrapper.text()).toBe(`true`);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    await waitForTime(1);

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${1001 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('pollingWhenOffline should work with pollingWhenHidden', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return () => <button>{`${loading.value || data.value}`}</button>;
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    // mock offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    // last request
    expect(wrapper.text()).toBe('true');
    await waitForTime(1000);
    expect(wrapper.text()).toBe(`1001`);
    await waitForTime(500);
    expect(wrapper.text()).toBe(`1001`);

    // mock tab show
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    // wait 1ms make to sure event has trigger
    await waitForTime(1);
    expect(wrapper.text()).toBe(`1001`);

    // mock online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    jsdom.window.dispatchEvent(new Event('online'));
    // wait 1ms to make sure event has trigger
    await waitForTime(1);

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${1001 + index + 1}`);
      await waitForTime(500);
    }
  });

  test('listener should unsubscribe when the component was unmounted', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, loading } = useRequest(() => request((count += 1)), {
            pollingInterval: 500,
          });
          return () => <button>{`${loading.value || data.value}`}</button>;
        },
      }),
    );

    for (let index = 0; index < 1000; index++) {
      expect(wrapper.text()).toBe('true');
      await waitForTime(1000);
      expect(wrapper.text()).toBe(`${index + 1}`);
      await waitForTime(500);
    }

    expect(RECONNECT_LISTENER.size).toBe(1);
    wrapper.unmount();
    expect(RECONNECT_LISTENER.size).toBe(0);
  });

  test('global options should work', async () => {
    const ComponentA = defineComponent({
      setup() {
        const { data, run } = useRequest(request);
        return () => <button onClick={() => run()}>{data.value}</button>;
      },
    });
    const ComponentB = defineComponent({
      setup() {
        const { data, run } = useRequest(request);
        return () => <button onClick={() => run()}>{data.value}</button>;
      },
    });

    setGlobalOptions({ manual: true });
    let wrapperA = shallowMount(ComponentA);
    let wrapperB = shallowMount(ComponentB);

    expect(wrapperA.find('button').text()).toBe('');
    expect(wrapperB.find('button').text()).toBe('');
    await waitForTime(1000);
    expect(wrapperA.find('button').text()).toBe('');
    expect(wrapperB.find('button').text()).toBe('');
    await wrapperA.find('button').trigger('click');
    await wrapperB.find('button').trigger('click');
    await waitForTime(1000);
    expect(wrapperA.find('button').text()).toBe('success');
    expect(wrapperB.find('button').text()).toBe('success');

    // clear global options
    clearGlobalOptions();
    wrapperA = shallowMount(ComponentA);
    wrapperB = shallowMount(ComponentB);

    expect(wrapperA.find('button').text()).toBe('');
    expect(wrapperB.find('button').text()).toBe('');
    await waitForTime(1000);
    expect(wrapperA.find('button').text()).toBe('success');
    expect(wrapperB.find('button').text()).toBe('success');
  });

  test('RequestConfig should work', async () => {
    const createComponent = (id: string, requestOptions: GlobalOptions = {}) =>
      defineComponent({
        setup() {
          const { loading, run } = useRequest(request, requestOptions);

          return () => (
            <button id={id} onClick={run}>
              {`${loading.value}`}
            </button>
          );
        },
      });

    const ComponentA = createComponent('A');
    const ComponentB = createComponent('B');
    const ComponentC = createComponent('C');
    const ComponentD = createComponent('D');
    const ComponentE = createComponent('E', { loadingDelay: 800 });

    setGlobalOptions({
      manual: true,
      loadingDelay: 500,
    });

    const Wrapper = defineComponent({
      setup() {
        return () => (
          <div id="root">
            <RequestConfig config={{ loadingDelay: 0 }}>
              <ComponentA />
            </RequestConfig>

            <RequestConfig config={{ manual: false }}>
              <ComponentB />

              <ComponentE />

              {/* nested */}
              <RequestConfig config={{ manual: true, loadingDelay: 200 }}>
                <ComponentC />
              </RequestConfig>
            </RequestConfig>

            <ComponentD />
          </div>
        );
      },
    });

    const wrapperA = mount(Wrapper);

    expect(wrapperA.find('#A').text()).toBe('false');
    expect(wrapperA.find('#B').text()).toBe('false');
    expect(wrapperA.find('#C').text()).toBe('false');
    expect(wrapperA.find('#D').text()).toBe('false');
    expect(wrapperA.find('#E').text()).toBe('false');

    await wrapperA.find('#A').trigger('click');
    await wrapperA.find('#C').trigger('click');
    await wrapperA.find('#D').trigger('click');

    expect(wrapperA.find('#A').text()).toBe('true');
    expect(wrapperA.find('#B').text()).toBe('false');
    expect(wrapperA.find('#C').text()).toBe('false');
    expect(wrapperA.find('#D').text()).toBe('false');
    expect(wrapperA.find('#E').text()).toBe('false');

    await waitForTime(200);

    expect(wrapperA.find('#A').text()).toBe('true');
    expect(wrapperA.find('#B').text()).toBe('false');
    expect(wrapperA.find('#C').text()).toBe('true');
    expect(wrapperA.find('#D').text()).toBe('false');
    expect(wrapperA.find('#E').text()).toBe('false');

    await waitForTime(300);

    expect(wrapperA.find('#A').text()).toBe('true');
    expect(wrapperA.find('#B').text()).toBe('true');
    expect(wrapperA.find('#C').text()).toBe('true');
    expect(wrapperA.find('#D').text()).toBe('true');
    expect(wrapperA.find('#E').text()).toBe('false');

    await waitForTime(300);

    expect(wrapperA.find('#A').text()).toBe('true');
    expect(wrapperA.find('#B').text()).toBe('true');
    expect(wrapperA.find('#C').text()).toBe('true');
    expect(wrapperA.find('#D').text()).toBe('true');
    expect(wrapperA.find('#E').text()).toBe('true');

    await waitForTime(200);

    expect(wrapperA.find('#A').text()).toBe('false');
    expect(wrapperA.find('#B').text()).toBe('false');
    expect(wrapperA.find('#C').text()).toBe('false');
    expect(wrapperA.find('#D').text()).toBe('false');
    expect(wrapperA.find('#E').text()).toBe('false');

    wrapperA.unmount();

    // clear global options
    clearGlobalOptions();
    const wrapperB = mount(Wrapper);

    expect(wrapperB.find('#A').text()).toBe('true');
    expect(wrapperB.find('#B').text()).toBe('true');
    expect(wrapperB.find('#C').text()).toBe('false');
    expect(wrapperB.find('#D').text()).toBe('true');
    expect(wrapperB.find('#E').text()).toBe('false');

    await wrapperB.find('#C').trigger('click');

    await waitForTime(200);

    expect(wrapperB.find('#A').text()).toBe('true');
    expect(wrapperB.find('#B').text()).toBe('true');
    expect(wrapperB.find('#C').text()).toBe('true');
    expect(wrapperB.find('#D').text()).toBe('true');
    expect(wrapperB.find('#E').text()).toBe('false');

    await waitForTime(600);

    expect(wrapperB.find('#A').text()).toBe('true');
    expect(wrapperB.find('#B').text()).toBe('true');
    expect(wrapperB.find('#C').text()).toBe('true');
    expect(wrapperB.find('#D').text()).toBe('true');
    expect(wrapperB.find('#E').text()).toBe('true');

    await waitForTime(200);

    expect(wrapperB.find('#A').text()).toBe('false');
    expect(wrapperB.find('#B').text()).toBe('false');
    expect(wrapperB.find('#C').text()).toBe('false');
    expect(wrapperB.find('#D').text()).toBe('false');
    expect(wrapperB.find('#E').text()).toBe('false');
  });
});
