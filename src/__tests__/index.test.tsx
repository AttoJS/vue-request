import FakeTimers from '@sinonjs/fake-timers';
import { mount, shallowMount } from '@vue/test-utils';
import fetchMock from 'fetch-mock';
import { defineComponent, ref } from 'vue';
import useRequest from '..';
import { ClearGlobalOptions, SetGlobalOptions } from '../config';
import { clearCache } from '../utils/cache';
import { waitForAll, waitForTime } from './utils';
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

  const unkonwService = 1;
  const serviceWillReturnString = () => successApi;
  const serviceWillReturnObject = () => ({ url: successApi });
  const serviceWillReturnUnknow = () => unkonwService;

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
    // clear cache
    clearCache();
    // clear global options
    ClearGlobalOptions();
  });

  afterEach(() => {
    console.error = originalError;
  });

  const request = (...args: any[]) =>
    new Promise<string>(resolve => {
      setTimeout(() => {
        resolve(args.join(',') || 'success');
      }, 1000);
    });

  const failedRequest = () =>
    new Promise<Error>((_, reject) => {
      setTimeout(() => {
        reject(new Error('fail'));
      }, 1000);
    });

  test('should be defined', () => {
    expect(useRequest).toBeDefined();
  });

  test('should use string service', async () => {
    const { data } = useRequest(successApi);
    await waitForAll();
    expect(data.value).toEqual({ data: 'success' });
  });

  test('should throw error when service error', async () => {
    const { error, run } = useRequest(failApi, {
      manual: true,
    });
    run.value().catch(() => {});
    await waitForAll();
    expect(error.value?.message).toBe('Not Found');
  });

  test('should use object service', async () => {
    const { data } = useRequest({ test: 'value', url: successApi });
    await waitForAll();
    expect(data.value).toEqual({ data: 'success' });
  });

  test('should use function service that will return string', async () => {
    const { data } = useRequest(serviceWillReturnString);
    await waitForAll();
    expect(data.value).toEqual({ data: 'success' });
  });

  test('should use function service that will return object', async () => {
    const { data } = useRequest(serviceWillReturnObject);
    await waitForAll();
    expect(data.value).toEqual({ data: 'success' });
  });

  test('should use function service that will return unknow type', () => {
    const fn = jest.fn();
    try {
      useRequest(serviceWillReturnUnknow as any);
    } catch (error) {
      expect(error.message).toBe('Unknown service type');
      fn();
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should throw error when use unkonw service', () => {
    const fn = jest.fn();
    try {
      useRequest(unkonwService as any);
    } catch (error) {
      expect(error.message).toBe('Unknown service type');
      fn();
    }
    expect(fn).toHaveBeenCalledTimes(1);
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

          return () => <button onClick={() => run.value()}>{`data:${data.value}`}</button>;
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
    const { params, run } = useRequest(request, {
      defaultParams: ['hello', 'world'],
    });

    await waitForAll();
    expect(params.value).toEqual(['hello', 'world']);

    run.value('hey');
    await waitForAll();
    expect(params.value).toEqual(['hey']);
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
            <button onClick={() => run.value('hello', 'world')}>{`data:${data.value}`}</button>
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

          return () => <button onClick={() => mutate.value('ok')}>{`data:${data.value}`}</button>;
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
            <button onClick={() => mutate.value(() => 'ok')}>{`data:${data.value}`}</button>
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
            <button onClick={() => refresh.value()}>{`loading:${loading.value}`}</button>
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
          const handleClick = () => run.value().catch(() => {}); // catch is needed or the node.js will be crash
          return () => <button onClick={handleClick}></button>;
        },
      }),
    );
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(console.error).toHaveBeenCalledWith(new Error('fail'));
  });

  test('request error can be handle by user', async () => {
    let errorText = '';

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { run } = useRequest(failedRequest, { manual: true, throwOnError: true });

          return () => (
            <button
              onClick={() =>
                run.value().catch((err: Error) => {
                  errorText = err.message;
                })
              }
            ></button>
          );
        },
      }),
    );
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(errorText).toBe('fail');
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
          const handleClick = () => run.value().catch(() => {}); // catch is needed or the node.js will be crash
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
          const { run } = useRequest(failedRequest, { manual: true, onError: mockErrorCallback });
          const handleClick = () => run.value().catch(() => {}); // catch is needed or the node.js will be crash
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
            >{`data:${data.value}`}</button>
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
              <button id="run" onClick={() => run.value('run')} />
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
              <button id="run" onClick={() => run.value('run')} />
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
                run.value(count.value);
              }}
            >{`data:${data.value}`}</button>
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

                // setTimeout(() => {
                count.value += 1;
                run.value(count.value);
                // }, 50);
              }}
            >{`data:${data.value}`}</button>
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

          const { loading } = useRequest(request, {
            refreshDeps: [refreshRef],
          });

          return () => (
            <button
              onClick={() => {
                refreshRef.value++;
              }}
            >{`loading:${loading.value}`}</button>
          );
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('loading:true');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('loading:false');
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

          return () => <button onClick={() => cancel.value()}>{`loading:${loading.value}`}</button>;
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
              <button onClick={() => cancel.value()} id="cancel" />
              <button onClick={() => run.value()} id="run" />
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
          const { data, run, cancel } = useRequest(failedRequest, { manual: true });
          return () => (
            <div>
              <button id="run" onClick={() => run.value().catch(() => {})}></button>;
              <button id="cancel" onClick={() => cancel.value()}></button>;
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

          return () => <button onClick={() => cancel.value()}>{`loading:${loading.value}`}</button>;
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

          return () => <button onClick={() => cancel.value()}>{`loading:${loading.value}`}</button>;
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
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
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
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:3');
    await waitForTime(2000);
    expect(wrapper.vm.$el.textContent).toBe('data:4');
    // mock tab show
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
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

          return () => <button onClick={() => run.value()}>{`data:${data.value}`}</button>;
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

  test('focusTimespan should work', async () => {
    let count = 0;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, run } = useRequest(() => request((count += 1)), {
            refreshOnWindowFocus: true,
            focusTimespan: 3000,
          });

          return () => <button onClick={() => run.value()}>{`data:${data.value}`}</button>;
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

    run.value();
    await waitForTime(50);
    run.value();
    await waitForTime(50);
    run.value();
    await waitForTime(50);
    run.value();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(1);

    run.value();
    await waitForTime(50);
    run.value();
    await waitForTime(50);
    run.value();
    await waitForTime(50);
    run.value();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('initial auto run should skip debounce', async () => {
    const mockFn = jest.fn();

    const { run } = useRequest(
      () => {
        mockFn();
        return request();
      },
      {
        debounceInterval: 100,
      },
    );

    expect(mockFn).toHaveBeenCalledTimes(1);

    run.value();
    await waitForTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleInterval should work', async () => {
    const mockFn = jest.fn();

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

    run.value();
    await waitForTime(50);
    run.value();
    await waitForTime(50);
    run.value();

    await waitForAll();
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('cache should work', async () => {
    let count = 0;
    const TestComponent = defineComponent({
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          cacheTime: 10000,
        });
        return () => <button onClick={() => run.value((count += 1))}>{data.value}</button>;
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
    const clock = FakeTimers.install({ toFake: ['Date'] });
    let count = 0;
    const TestComponent = defineComponent({
      setup() {
        const { data, run } = useRequest(request, {
          cacheKey: 'cacheKey',
          staleTime: 5000,
        });
        return () => <button onClick={() => run.value((count += 1))}>{data.value}</button>;
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
    clock.setSystemTime(new Date().getTime() + 5000);

    // remount component
    wrapper = shallowMount(TestComponent);
    expect(wrapper.find('button').text()).toBe('10');
    await waitForTime(1000);
    expect(wrapper.find('button').text()).toBe('10');
    clock.uninstall();
  });

  test('global options should work', async () => {
    const ComponentA = defineComponent({
      setup() {
        const { data, run } = useRequest(request);
        return () => <button onClick={() => run.value()}>{data.value}</button>;
      },
    });
    const ComponentB = defineComponent({
      setup() {
        const { data, run } = useRequest(request);
        return () => <button onClick={() => run.value()}>{data.value}</button>;
      },
    });

    SetGlobalOptions({ manual: true });
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
    ClearGlobalOptions();
    wrapperA = shallowMount(ComponentA);
    wrapperB = shallowMount(ComponentB);

    expect(wrapperA.find('button').text()).toBe('');
    expect(wrapperB.find('button').text()).toBe('');
    await waitForTime(1000);
    expect(wrapperA.find('button').text()).toBe('success');
    expect(wrapperB.find('button').text()).toBe('success');
  });

  test('queryKey should work : case 1', async () => {
    // auto run with no params
    const { loading, params, data } = useRequest(request, {
      queryKey: id => id,
    });

    expect(loading.value).toBe(true);
    await waitForAll();
    expect(loading.value).toBe(false);
    expect(data.value).toBe('success');
    expect(params.value).toEqual([]);
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
                  <li key={item.id} id={item.username} onClick={() => run.value(item.id)}>
                    {queries.value[item.id]?.loading ? 'loading' : item.username}
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
                <li key={item.id} id={item.username} onClick={() => run.value(item.id)}>
                  {queries.value[item.id]?.loading ? 'loading' : item.username}
                </li>
              ))}
            </ul>
          </div>
        );
      },
    });

    const Parent = mount({
      props: {
        show: {
          type: Boolean,
          default: false,
        },
      },
      setup(props) {
        return () => <div>{props.show && <Child />}</div>;
      },
    });

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
});
