import Mock from 'mockjs';
import { defineComponent } from 'vue-demi';

import { clearGlobalOptions } from '../core/config';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { usePagination } from '../index';
import { mount, waitForTime } from './utils';

type CustomPropertyMockDataType = {
  result: Array<{ name: string; age: number }>;
  myTotal: { a: { b: { total: number } } };
  myTotalPage: { a: { b: { totalPage: number } } };
};

type NormalMockDataType = {
  result: Array<{ name: string; age: number }>;
  total: number;
};

describe('usePagination', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  const normalApi = (page: { pageSize: number; current: number }) => {
    return new Promise<NormalMockDataType>(resolve => {
      setTimeout(() => {
        resolve(normalMockData);
      }, 1000);
    });
  };
  const customPropertyApi = (page: { pageSize: number; current: number }) => {
    return new Promise<CustomPropertyMockDataType>(resolve => {
      setTimeout(() => {
        resolve(customPropertyMockData);
      }, 1000);
    });
  };
  const customConfigApi = (page: { pageSize: number; current: number }) => {
    return new Promise<CustomPropertyMockDataType>(resolve => {
      setTimeout(() => {
        resolve(customConfigMockData);
      }, 1000);
    });
  };

  // mock fetch
  const normalMockData: NormalMockDataType = Mock.mock({
    'result|10': [
      {
        name: '@name',
        'age|18-36': 1,
      },
    ],
    total: 100,
  });

  const customPropertyMockData: CustomPropertyMockDataType = Mock.mock({
    'result|10': [
      {
        name: '@name',
        'age|18-36': 1,
      },
    ],
    myTotal: { a: { b: { total: 100 } } },
    myTotalPage: { a: { b: { totalPage: 99 } } },
  });

  const customConfigMockData: CustomPropertyMockDataType = Mock.mock({
    'result|10': ['@name'],
    total: 99,
    total1: 1,
    total2: 2,
    total3: 3,
    total4: 4,
    total5: 5,
  });

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
    expect(usePagination).toBeDefined();
  });

  test('usePagination should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { data, total, params, current, pageSize, totalPage } =
            usePagination<NormalMockDataType>(normalApi);
          return {
            data,
            total,
            params,
            current,
            pageSize,
            totalPage,
          };
        },
      }),
    );

    expect(JSON.stringify(wrapper.data?.result)).toBeUndefined();
    expect(wrapper.current).toBe(1);
    expect(wrapper.pageSize).toBe(10);
    expect(JSON.stringify(wrapper.params)).toBe(
      '[{"current":1,"pageSize":10}]',
    );
    expect(wrapper.total).toBe(0);
    expect(wrapper.totalPage).toBe(0);

    await waitForTime(1000);
    expect(JSON.stringify(wrapper.data?.result)).toBe(
      JSON.stringify(normalMockData.result),
    );
    expect(wrapper.current).toBe(1);
    expect(wrapper.pageSize).toBe(10);
    expect(JSON.stringify(wrapper.params)).toBe(
      '[{"current":1,"pageSize":10}]',
    );
    expect(wrapper.total).toBe(normalMockData.total);
    expect(wrapper.totalPage).toBe(10);
  });

  test('changeCurrent should work', async () => {
    let _current = 1;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { total, params, current, pageSize, totalPage, changeCurrent } =
            usePagination(normalApi);
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent: () => changeCurrent((_current += 1)),
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      await waitForTime(1000);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":10}]`,
      );
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(10);
      expect(wrapper.totalPage).toBe(10);
    }
  });

  test('changePageSize should work', async () => {
    let _pageSize = 10;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changePageSize,
          } = usePagination(normalApi);
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changePageSize: () => changePageSize((_pageSize += 1)),
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      wrapper.changePageSize();
      await waitForTime(1000);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":1,"pageSize":${_pageSize}}]`,
      );
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(1);
      expect(wrapper.pageSize).toBe(_pageSize);
      expect(wrapper.totalPage).toBe(Math.ceil(100 / _pageSize));
    }
  });

  test('custom pagination property should work', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { total, params, current, pageSize, totalPage } = usePagination(
            customPropertyApi,
            {
              pagination: {
                currentKey: 'myCurrent',
                pageSizeKey: 'myPageSize',
                totalKey: 'myTotal.a.b.total',
                totalPageKey: 'myTotalPage.a.b.totalPage',
              },
            },
          );
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
          };
        },
      }),
    );

    await waitForTime(1000);
    expect(JSON.stringify(wrapper.params)).toBe(
      '[{"myCurrent":1,"myPageSize":10}]',
    );
    expect(wrapper.total).toBe(100);
    expect(wrapper.current).toBe(1);
    expect(wrapper.pageSize).toBe(10);
    expect(wrapper.totalPage).toBe(99);
  });

  test('`current` and `pageSize` `current` and `pageSize` can modify and can trigger request', async () => {
    let _current = 1;
    let _pageSize = 10;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, current, pageSize, params } =
            usePagination(normalApi);
          return {
            loading,
            current,
            pageSize,
            params,
            changeCurrent: () => (_current = ++current.value),
            changePageSize: () => (_pageSize = ++pageSize.value),
          };
        },
      }),
    );

    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(_pageSize);
    }

    for (let index = 0; index < 100; index++) {
      wrapper.changePageSize();
      expect(wrapper.loading).toBe(true);
      await waitForTime(1000);
      expect(wrapper.loading).toBe(false);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(_pageSize);
    }
  });

  test('`reload` should work', async () => {
    let _current = 1;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            reloading,
            reload,
          } = usePagination<NormalMockDataType>(normalApi);
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            reloading,
            reload,
            changeCurrent: () => (current.value = ++_current),
          };
        },
      }),
    );

    await waitForTime(1000);
    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      expect(wrapper.reloading).toBe(false);
      await waitForTime(1000);
      expect(wrapper.reloading).toBe(false);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":10}]`,
      );
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(10);
      expect(wrapper.totalPage).toBe(10);
    }

    wrapper.reload();
    expect(wrapper.reloading).toBe(true);
    _current = 1;
    await waitForTime(1000);
    expect(wrapper.reloading).toBe(false);
    expect(JSON.stringify(wrapper.params)).toBe(
      `[{"current":${_current},"pageSize":10}]`,
    );
    expect(wrapper.total).toBe(100);
    expect(wrapper.current).toBe(_current);
    expect(wrapper.pageSize).toBe(10);
    expect(wrapper.totalPage).toBe(10);

    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      expect(wrapper.reloading).toBe(false);
      await waitForTime(1000);
      expect(wrapper.reloading).toBe(false);
      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":10}]`,
      );
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(10);
      expect(wrapper.totalPage).toBe(10);
    }
  });

  test('changeCurrent should work', async () => {
    let _current = 1;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { total, params, current, pageSize, totalPage, changeCurrent } =
            usePagination(normalApi, {
              manual: true,
            });
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent: () => changeCurrent((_current += 1)),
          };
        },
      }),
    );

    expect(JSON.stringify(wrapper.params)).toBeUndefined();
    expect(wrapper.total).toBe(0);
    expect(wrapper.current).toBe(1);
    expect(wrapper.pageSize).toBe(10);
    expect(wrapper.totalPage).toBe(0);

    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      await waitForTime(1000);

      expect(JSON.stringify(wrapper.params)).toBe(`[{"current":${_current}}]`);
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(10);
      expect(wrapper.totalPage).toBe(10);
    }
  });

  test('changePagination should work', async () => {
    let _current = 1;
    let _pageSize = 1;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changePagination,
          } = usePagination(normalApi, {
            manual: true,
          });
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changePagination: () => {
              _current += 1;
              _pageSize += 1;
              changePagination(_current, _pageSize);
            },
          };
        },
      }),
    );

    expect(JSON.stringify(wrapper.params)).toBeUndefined();
    expect(wrapper.total).toBe(0);
    expect(wrapper.current).toBe(_current);
    expect(wrapper.pageSize).toBe(10);
    expect(wrapper.totalPage).toBe(0);

    for (let index = 0; index < 100; index++) {
      wrapper.changePagination();
      await waitForTime(1000);

      expect(JSON.stringify(wrapper.params)).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(_pageSize);
      expect(wrapper.totalPage).toBe(Math.ceil(100 / _pageSize));
    }
  });

  test('manual should work with defaltParams', async () => {
    let _current = 1;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { total, params, current, pageSize, totalPage, changeCurrent } =
            usePagination(normalApi, {
              manual: true,
              defaultParams: [
                {
                  pageSize: 20,
                  current: 2,
                },
              ],
            });
          return {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent: () => changeCurrent((_current += 1)),
          };
        },
      }),
    );

    expect(JSON.stringify(wrapper.params)).toBeUndefined();
    expect(wrapper.total).toBe(0);
    expect(wrapper.current).toBe(2);
    expect(wrapper.pageSize).toBe(20);
    expect(wrapper.totalPage).toBe(0);

    for (let index = 0; index < 100; index++) {
      wrapper.changeCurrent();
      await waitForTime(1000);

      expect(JSON.stringify(wrapper.params)).toBe(`[{"current":${_current}}]`);
      expect(wrapper.total).toBe(100);
      expect(wrapper.current).toBe(_current);
      expect(wrapper.pageSize).toBe(20);
      expect(wrapper.totalPage).toBe(5);
    }
  });

  test('onBefore and onAfter hooks can use in `usePagination`', async () => {
    const onBefore = jest.fn();
    const onAfter = jest.fn();

    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { changeCurrent } = usePagination<NormalMockDataType>(
            normalApi,
            {
              onBefore,
              onAfter,
            },
          );
          return {
            changeCurrent: () => changeCurrent(1),
          };
        },
      }),
    );

    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(1);

    wrapper.changeCurrent();
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(1);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(2);
  });
});
