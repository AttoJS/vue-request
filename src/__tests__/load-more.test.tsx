import { shallowMount } from '@vue/test-utils';
import fetchMock from 'fetch-mock';
import Mock from 'mockjs';
import { defineComponent } from 'vue';
import { clearGlobalOptions } from '../core/config';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { useLoadMore } from '../index';
import { waitForTime } from './utils';
import { failedRequest } from './utils/request';

type CustomPropertyMockDataType = {
  myData: {
    result: string[];
  };
};

type NormalMockDataType = {
  list: string[];
};

describe('useLoadMore', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  const normalApi = 'http://example.com/normal';
  const customPropertyApi = 'http://example.com/custom';

  // mock fetch
  const normalMockData: NormalMockDataType = Mock.mock({
    'list|10': ['@name'],
  });

  const customPropertyMockData: CustomPropertyMockDataType = {
    myData: Mock.mock({
      'result|10': ['@name'],
    }),
  };

  fetchMock.get(normalApi, normalMockData, { delay: 1000 });
  fetchMock.get(customPropertyApi, customPropertyMockData, { delay: 1000 });

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
  type rawDataType = {
    data: NormalAPIReturnType;
    dataList: NormalAPIReturnType['list'];
  };

  const normalRequest = (rawData: rawDataType) => {
    const current = (rawData?.data?.current || 0) + 1;
    return new Promise<NormalAPIReturnType>(resolve => {
      setTimeout(() => {
        resolve(generateNormalData(current));
      }, 1000);
    });
  };

  function generateCustomData(current: number, total = 10) {
    let list: string[] = [];
    if (current <= total) {
      list = customPropertyMockData.myData.result;
    } else {
      list = [];
    }
    return {
      current,
      total,
      myData: {
        result: list,
      },
    };
  }

  type CustomAPIReturnType = ReturnType<typeof generateCustomData>;
  type CustomRawDataType = {
    data: CustomAPIReturnType;
    dataList: CustomAPIReturnType['myData']['result'];
  };

  const customRequest = (rawData: CustomRawDataType) => {
    const current = (rawData?.data?.current || 0) + 1;
    return new Promise<CustomAPIReturnType>(resolve => {
      setTimeout(() => {
        resolve(generateCustomData(current));
      }, 1000);
    });
  };

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
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
    expect(useLoadMore).toBeDefined();
  });

  test('useLoadMore only support function service', () => {
    const fn = jest.fn();

    try {
      // @ts-ignore
      useLoadMore(normalApi);
    } catch (error) {
      fn();
      expect(error.message).toBe('useLoadMore only support function service');
    }

    try {
      // @ts-ignore
      useLoadMore({ url: normalApi });
    } catch (error) {
      fn();
      expect(error.message).toBe('useLoadMore only support function service');
    }

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('useLoadMore not support queryKey', () => {
    const fn = jest.fn();

    try {
      useLoadMore(normalRequest, {
        // @ts-ignore
        queryKey: () => 'key',
      });
    } catch (error) {
      fn();
      expect(error.message).toBe(
        'useLoadMore does not support concurrent request',
      );
    }

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('useLoadMore should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            dataList,
            loadingMore,
            loading,
            noMore,
            loadMore,
          } = useLoadMore(normalRequest, {
            isNoMore: d => d?.current >= d?.total,
          });
          return () => (
            <div>
              <div class="dataList">{dataList.value.length || 0}</div>
              <div class="loadingMore">{`${loadingMore.value}`}</div>
              <div class="loading">{`${loading.value}`}</div>
              <div class="noMore">{`${noMore.value}`}</div>
              <div
                class="loadMore"
                onClick={() => {
                  loadMore();
                }}
              />
            </div>
          );
        },
      }),
    );

    const dataListEl = wrapper.find('.dataList');
    const loadingMoreEl = wrapper.find('.loadingMore');
    const loadingEl = wrapper.find('.loading');
    const loadMoreEl = wrapper.find('.loadMore');
    const noMoreEl = wrapper.find('.noMore');

    expect(dataListEl.text()).toBe('0');
    expect(loadingMoreEl.text()).toBe('false');
    expect(loadingEl.text()).toBe('true');
    expect(noMoreEl.text()).toBe('false');

    await waitForTime(1000);
    expect(dataListEl.text()).toBe('10');
    expect(loadingMoreEl.text()).toBe('false');
    expect(loadingEl.text()).toBe('false');
    expect(noMoreEl.text()).toBe('false');

    for (let index = 1; index <= 9; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingMoreEl.text()).toBe('true');
      expect(loadingEl.text()).toBe('true');
      await waitForTime(1000);
      expect(dataListEl.text()).toBe(`${10 + index * 10}`);
      expect(noMoreEl.text()).toBe(`${index === 9}`);
    }

    for (let index = 0; index < 100; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingMoreEl.text()).toBe('false');
      expect(loadingEl.text()).toBe('false');
      await waitForTime(1000);
      expect(loadingMoreEl.text()).toBe('false');
      expect(loadingEl.text()).toBe('false');
      expect(dataListEl.text()).toBe('100');
      expect(noMoreEl.text()).toBe('true');
    }
  });

  test('listKey should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            dataList,
            loadingMore,
            loading,
            noMore,
            loadMore,
          } = useLoadMore(customRequest, {
            isNoMore: d => d?.current >= d?.total,
            listKey: 'myData.result',
          });
          return () => (
            <div>
              <div class="dataList">{dataList.value.length || 0}</div>
              <div class="loadingMore">{`${loadingMore.value}`}</div>
              <div class="loading">{`${loading.value}`}</div>
              <div class="noMore">{`${noMore.value}`}</div>
              <div
                class="loadMore"
                onClick={() => {
                  loadMore();
                }}
              />
            </div>
          );
        },
      }),
    );

    const dataListEl = wrapper.find('.dataList');
    const loadingMoreEl = wrapper.find('.loadingMore');
    const loadingEl = wrapper.find('.loading');
    const loadMoreEl = wrapper.find('.loadMore');
    const noMoreEl = wrapper.find('.noMore');

    expect(dataListEl.text()).toBe('0');
    expect(loadingMoreEl.text()).toBe('false');
    expect(loadingEl.text()).toBe('true');
    expect(noMoreEl.text()).toBe('false');

    await waitForTime(1000);
    expect(dataListEl.text()).toBe('10');
    expect(loadingMoreEl.text()).toBe('false');
    expect(loadingEl.text()).toBe('false');
    expect(noMoreEl.text()).toBe('false');

    for (let index = 1; index <= 9; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingMoreEl.text()).toBe('true');
      expect(loadingEl.text()).toBe('true');
      await waitForTime(1000);
      expect(dataListEl.text()).toBe(`${10 + index * 10}`);
      expect(noMoreEl.text()).toBe(`${index === 9}`);
    }
  });

  test('reload should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            dataList,
            loadingMore,
            noMore,
            loading,
            loadMore,
            reload,
          } = useLoadMore(normalRequest, {
            isNoMore: d => d?.current >= d?.total,
          });
          return () => (
            <div>
              <div class="dataList">{dataList.value.length || 0}</div>
              <div class="loadingMore">{`${loadingMore.value}`}</div>
              <div class="loading">{`${loading.value}`}</div>
              <div class="noMore">{`${noMore.value}`}</div>
              <div
                class="loadMore"
                onClick={() => {
                  loadMore();
                }}
              />
              <div
                class="reload"
                onClick={() => {
                  reload();
                }}
              />
            </div>
          );
        },
      }),
    );

    const dataListEl = wrapper.find('.dataList');
    const loadingMoreEl = wrapper.find('.loadingMore');
    const loadingEl = wrapper.find('.loading');
    const loadMoreEl = wrapper.find('.loadMore');
    const noMoreEl = wrapper.find('.noMore');
    const reloadEl = wrapper.find('.reload');

    expect(loadingEl.text()).toBe('true');
    await waitForTime(1000);
    expect(loadingEl.text()).toBe('false');
    expect(dataListEl.text()).toBe('10');
    expect(loadingMoreEl.text()).toBe('false');
    expect(noMoreEl.text()).toBe('false');

    for (let index = 1; index <= 9; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingMoreEl.text()).toBe('true');
      expect(loadingEl.text()).toBe('true');
      await waitForTime(1000);
      expect(loadingEl.text()).toBe('false');
      expect(loadingMoreEl.text()).toBe('false');
      expect(dataListEl.text()).toBe(`${10 + index * 10}`);
      expect(noMoreEl.text()).toBe(`${index === 9}`);
    }

    for (let index = 0; index < 100; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingMoreEl.text()).toBe('false');
      expect(loadingEl.text()).toBe('false');
      await waitForTime(1000);
      expect(loadingEl.text()).toBe('false');
      expect(loadingMoreEl.text()).toBe('false');
      expect(dataListEl.text()).toBe('100');
      expect(noMoreEl.text()).toBe('true');
    }

    await reloadEl.trigger('click');
    expect(loadingEl.text()).toBe('true');
    expect(loadingMoreEl.text()).toBe('false');
    expect(dataListEl.text()).toBe('0');
    expect(noMoreEl.text()).toBe('false');
    await waitForTime(1000);
    expect(loadingEl.text()).toBe('false');
    expect(dataListEl.text()).toBe('10');

    for (let index = 1; index <= 9; index++) {
      await loadMoreEl.trigger('click');
      expect(loadingEl.text()).toBe('true');
      expect(loadingMoreEl.text()).toBe('true');
      await waitForTime(1000);
      expect(loadingEl.text()).toBe('false');
      expect(loadingMoreEl.text()).toBe('false');
      expect(dataListEl.text()).toBe(`${10 + index * 10}`);
      expect(noMoreEl.text()).toBe(`${index === 9}`);
    }
  });

  test('useLoadMore when request error', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loadingMore, loadMore } = useLoadMore(failedRequest);
          return () => (
            <div>
              <div class="loadingMore">{`${loadingMore.value}`}</div>
              <div
                class="loadMore"
                onClick={() => {
                  loadMore();
                }}
              />
            </div>
          );
        },
      }),
    );

    const loadingMoreEl = wrapper.find('.loadingMore');
    const loadMoreEl = wrapper.find('.loadMore');
    await waitForTime(1000);
    expect(loadingMoreEl.text()).toBe('false');
    await loadMoreEl.trigger('click');
    expect(loadingMoreEl.text()).toBe('true');
    await waitForTime(1000);
    expect(loadingMoreEl.text()).toBe('false');
  });
});
