import Mock from 'mockjs';
import { defineComponent, ref } from 'vue-demi';

import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { useLoadMore } from '../index';
import { mount, waitForAll, waitForTime } from './utils';

type NormalMockDataType = {
  list: string[];
};

describe('useLoadMore', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  // mock fetch
  const normalMockData: NormalMockDataType = Mock.mock({
    'list|10': ['@name'],
  });

  function generateNormalData(current: number, total = 10) {
    let list: string[] = [];
    if (current <= total) {
      list = normalMockData.list;
    } else {
      list = [];
    }
    return {
      current,
      total,
      list,
    };
  }

  type NormalAPIReturnType = ReturnType<typeof generateNormalData>;

  const normalRequest = (rawData?: NormalAPIReturnType) => {
    const current = (rawData?.current || 0) + 1;
    return new Promise<NormalAPIReturnType>(resolve => {
      setTimeout(() => {
        resolve(generateNormalData(current));
      }, 1000);
    });
  };

  let count = 0;
  const failRequest = (
    rawData?: NormalAPIReturnType,
    whenError = 3,
    errorTime = 3,
  ) => {
    const current = (rawData?.current || 0) + 1;
    return new Promise<NormalAPIReturnType>((resolve, rejects) => {
      if (current === whenError && count !== errorTime) {
        setTimeout(() => {
          count++;
          rejects('bad request');
        }, 1000);
      } else {
        setTimeout(() => {
          resolve(generateNormalData(current));
        }, 1000);
      }
    });
  };

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();

    // clear listener
    RECONNECT_LISTENER.clear();
    FOCUS_LISTENER.clear();
    VISIBLE_LISTENER.clear();

    count = 0;
  });

  afterEach(() => {
    console.error = originalError;
  });

  test('should be defined', () => {
    expect(useLoadMore).toBeDefined();
  });

  test('useLoadMore should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loading, noMore, loadMore } =
            useLoadMore(normalRequest, {
              isNoMore: d => (d ? d?.current >= d?.total : false),
            });
          return {
            dataList,
            loadingMore,
            loading,
            noMore,
            loadMore,
          };
        },
      }),
    );

    expect(wrapper.dataList).toHaveLength(0);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.loading).toBe(true);
    expect(wrapper.noMore).toBe(false);

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(10);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.noMore).toBe(false);

    for (let index = 1; index <= 9; index++) {
      wrapper.loadMore();
      expect(wrapper.loadingMore).toBe(true);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.dataList).toHaveLength(10 + index * 10);
      expect(wrapper.noMore).toBe(index === 9);
    }

    for (let index = 0; index < 10; index++) {
      wrapper.loadMore();
      expect(wrapper.loadingMore).toBe(false);
      expect(wrapper.loading).toBe(false);
      await waitForTime(1000);
      expect(wrapper.loadingMore).toBe(false);
      expect(wrapper.loading).toBe(false);
      expect(wrapper.dataList).toHaveLength(100);
      expect(wrapper.noMore).toBe(true);
    }
  });

  test('refresh should work, case: 1', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loading, loadMore, refresh } =
            useLoadMore(normalRequest);
          return {
            dataList,
            loadingMore,
            loading,
            loadMore,
            refresh,
          };
        },
      }),
    );

    for (let index = 1; index <= 5; index++) {
      await waitForTime(1000);
      wrapper.loadMore();
    }

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(60);

    wrapper.refresh();
    expect(wrapper.dataList).toHaveLength(60);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.loading).toBe(true);

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(10);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.loading).toBe(false);
  });

  test('refresh should work, case: 2', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loading, refresh } =
            useLoadMore(normalRequest);
          return {
            dataList,
            loadingMore,
            loading,
            refresh,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(false);
    wrapper.refresh();
    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(false);
    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(10);
  });

  test('cancel should work, case: 1', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loading, loadMore, refresh, cancel } =
            useLoadMore(normalRequest);
          return {
            dataList,
            loadingMore,
            loading,
            loadMore,
            refresh,
            cancel,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(false);
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.dataList).toHaveLength(10);
    expect(wrapper.loadingMore).toBe(false);

    // trigger loadMore
    wrapper.loadMore();
    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(true);
    await waitForTime(100);
    // trigger cancel
    wrapper.cancel();
    expect(wrapper.loading).toBe(false);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.dataList).toHaveLength(10);

    // trigger refresh
    wrapper.refresh();
    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(false);
    await waitForTime(100);
    // trigger cancel
    wrapper.cancel();
    expect(wrapper.loading).toBe(false);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.dataList).toHaveLength(10);
  });

  test('cancel should work, case: 2', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loading, cancel } =
            useLoadMore(normalRequest);
          return {
            dataList,
            loadingMore,
            loading,
            cancel,
          };
        },
      }),
    );

    expect(wrapper.loading).toBe(true);
    expect(wrapper.loadingMore).toBe(false);

    // trigger cancel
    wrapper.cancel();
    expect(wrapper.loading).toBe(false);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.dataList).toHaveLength(0);

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(0);
  });

  test('useLoadMore when request error', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadingMore, loadMore } = useLoadMore<NormalAPIReturnType>(
            d => failRequest(d || undefined, 1),
          );
          return {
            loadingMore,
            loadMore,
          };
        },
      }),
    );

    await waitForTime(1000);
    expect(wrapper.loadingMore).toBe(false);
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loadingMore).toBe(false);
  });

  test('error retry should work. case:1', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadingMore, loading, error, loadMore } = useLoadMore(
            failRequest,
            {
              manual: true,
              errorRetryCount: 3,
              errorRetryInterval: 1000,
            },
          );
          return {
            error,
            loading,
            loadingMore,
            loadMore,
          };
        },
      }),
    );

    for (let oIndex = 1; oIndex <= 10; oIndex++) {
      wrapper.loadMore();
      expect(wrapper.loadingMore).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loadingMore).toBe(false);
      if (oIndex === 3) {
        // retrying
        for (let index = 1; index <= 3; index++) {
          expect(wrapper.error).not.toBeUndefined();
          await waitForTime(1000);
          expect(wrapper.loading).toBe(true);
          await waitForTime(1000);
          expect(wrapper.loading).toBe(false);
        }
      } else {
        expect(wrapper.error).toBeUndefined();
      }
    }
  });

  test('error retry should work. case:2', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { error, loading, loadingMore, loadMore } =
            useLoadMore<NormalAPIReturnType>(
              d => failRequest(d || undefined, 1, 10),
              {
                manual: true,
                errorRetryCount: 2,
                errorRetryInterval: 1000,
              },
            );
          return {
            error,
            loading,
            loadingMore,
            loadMore,
          };
        },
      }),
    );

    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(true);
    await waitForTime(1000);
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.error).not.toBeUndefined();
    // retrying
    for (let index = 1; index <= 2; index++) {
      expect(wrapper.error).not.toBeUndefined();
      await waitForTime(1000);
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
    }
    await waitForTime(1000);
    expect(wrapper.loading).toBe(false);
  });

  test('onBefore and onAfter hooks can use in `useLoadMore`', async () => {
    const onBefore = jest.fn();
    const onAfter = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadMore } = useLoadMore(normalRequest, {
            onBefore,
            onAfter,
          });
          return {
            loadMore,
          };
        },
      }),
    );

    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(1);

    wrapper.loadMore();
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(1);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(2);
  });

  test('refreshDeps should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const refreshRef = ref(0);
          const { dataList, loadMore } = useLoadMore(normalRequest, {
            refreshDeps: [refreshRef],
          });

          const handleUpdateRef = () => {
            refreshRef.value++;
          };
          return {
            dataList,
            loadMore,
            handleUpdateRef,
          };
        },
      }),
    );

    for (let index = 1; index <= 5; index++) {
      await waitForTime(1000);
      wrapper.loadMore();
    }

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(60);
    wrapper.handleUpdateRef();
    await waitForTime(1);

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(10);
  });

  test('refreshDepsAction should work', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const refreshRef = ref(0);
          const { dataList, loadMore } = useLoadMore(normalRequest, {
            refreshDeps: [refreshRef],
            refreshDepsAction: () => {
              mockFn();
            },
          });

          const handleUpdateRef = () => {
            refreshRef.value++;
          };
          return {
            dataList,
            loadMore,
            handleUpdateRef,
          };
        },
      }),
    );

    for (let index = 1; index <= 5; index++) {
      await waitForTime(1000);
      wrapper.loadMore();
    }

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(60);
    wrapper.handleUpdateRef();
    await waitForTime(1);

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(60);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('mutate should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, data, loadMore, mutate } =
            useLoadMore(normalRequest);

          return {
            data,
            dataList,
            loadMore,
            mutate,
          };
        },
      }),
    );

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(10);

    // if mutate params is function
    wrapper.mutate(d => {
      d.list = ['1'];
      return d;
    });
    expect(wrapper.dataList).toHaveLength(1);

    // if mutate params is data
    const data = JSON.parse(JSON.stringify(wrapper.dataList));
    data.list = ['2', '3'];
    wrapper.mutate(data);
    expect(wrapper.dataList).toHaveLength(2);

    // @ts-ignore
    wrapper.mutate(() => {
      return 'change';
    });

    expect(wrapper.data).toBe('change');
  });

  test('debounceInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadMore } = useLoadMore<NormalAPIReturnType>(
            d => {
              mockFn();
              return normalRequest(d);
            },
            {
              manual: true,
              debounceInterval: 100,
            },
          );

          return {
            loadMore,
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      wrapper.loadMore();
      await waitForTime(50);
    }
    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      wrapper.loadMore();
      await waitForTime(50);
    }

    await waitForTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('throttleInterval should work', async () => {
    const mockFn = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadMore } = useLoadMore<NormalAPIReturnType>(
            d => {
              mockFn();
              return normalRequest(d);
            },
            {
              manual: true,
              throttleInterval: 100,
            },
          );

          return {
            loadMore,
          };
        },
      }),
    );

    wrapper.loadMore();

    await waitForTime(50);
    wrapper.loadMore();
    wrapper.loadMore();
    wrapper.loadMore();

    await waitForTime(50);
    wrapper.loadMore();

    await waitForAll();
    // have been call 3 times
    // because the function will invoking on the leading edge and trailing edge of the timeout
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('ready should work when manual=true', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);

          const { dataList, loadingMore, loadMore } = useLoadMore(
            normalRequest,
            {
              ready: readyRef,
              manual: true,
            },
          );
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            dataList,
            loadingMore,
            loadMore,
            handleUpdateReady,
          };
        },
      }),
    );
    // ready = false
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(0);

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(true);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(10);

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(10);

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(true);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(20);
  });

  test('ready should work when manual=false', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const readyRef = ref(false);

          const { dataList, loadingMore, loadMore } = useLoadMore(
            normalRequest,
            {
              ready: readyRef,
            },
          );
          const handleUpdateReady = () => {
            readyRef.value = !readyRef.value;
          };
          return {
            dataList,
            loadingMore,
            loadMore,
            handleUpdateReady,
          };
        },
      }),
    );
    // ready = false
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(0);

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(true);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(10);

    // ready = false
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    wrapper.loadMore();
    expect(wrapper.loadingMore).toBe(false);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(10);

    // ready = true
    wrapper.handleUpdateReady();
    expect(wrapper.loadingMore).toBe(true);
    await waitForAll();
    expect(wrapper.dataList.length).toBe(10);
  });

  test('loadMoreAsync should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadingMore, loadMoreAsync } = useLoadMore(normalRequest, {
            manual: true,
          });

          return {
            loadingMore,
            loadMoreAsync,
          };
        },
      }),
    );
    wrapper.loadMoreAsync().then(res => {
      expect(res.current).toBe(1);
    });
    expect(wrapper.loadingMore).toBe(true);
    await waitForAll();
    expect(wrapper.loadingMore).toBe(false);
  });

  test('refreshAsync should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loadingMore, dataList, loading, refreshAsync, loadMore } =
            useLoadMore(normalRequest);

          return {
            loading,
            dataList,
            loadingMore,
            loadMore,
            refreshAsync,
          };
        },
      }),
    );

    for (let index = 1; index <= 5; index++) {
      await waitForTime(1000);
      wrapper.loadMore();
    }

    await waitForTime(1000);
    expect(wrapper.dataList).toHaveLength(60);

    wrapper.refreshAsync().then(res => {
      expect(res.current).toBe(1);
    });
    expect(wrapper.loadingMore).toBe(false);
    expect(wrapper.loading).toBe(true);
    await waitForAll();
    expect(wrapper.dataList).toHaveLength(10);
    expect(wrapper.loading).toBe(false);
    expect(wrapper.loadingMore).toBe(false);
  });

  test('loadMoreAsync should throw reject when nomore data', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { dataList, loadingMore, loadMoreAsync } = useLoadMore(
            normalRequest,
            {
              manual: true,
              isNoMore: d => (d ? d?.current >= d?.total : false),
            },
          );

          return {
            dataList,
            loadingMore,
            loadMoreAsync,
          };
        },
      }),
    );
    for (let index = 1; index <= 10; index++) {
      wrapper.loadMoreAsync();
      await waitForAll();
    }

    expect(wrapper.dataList.length).toBe(100);
    expect(wrapper.loadingMore).toBe(false);
    try {
      wrapper.loadMoreAsync();
    } catch (error) {
      expect(error.message.includes('No more data')).toBe(true);
    }
  });
});
