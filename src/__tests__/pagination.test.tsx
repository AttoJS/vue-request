import fetchMock from 'fetch-mock';
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

  const normalApi = 'http://example.com/normal';
  const customPropertyApi = 'http://example.com/custom';
  const customConfigApi = 'http://example.com/customConfig';

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

  fetchMock.get(normalApi, normalMockData, { delay: 1000 });
  fetchMock.get(customPropertyApi, customPropertyMockData, { delay: 1000 });
  fetchMock.get(customConfigApi, customConfigMockData, { delay: 1000 });

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
          const {
            data,
            total,
            params,
            current,
            pageSize,
            totalPage,
          } = usePagination<NormalMockDataType>(normalApi);
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

    expect(JSON.stringify(wrapper.data?.result)).toBe('');
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
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent,
          } = usePagination(normalApi);
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

    const paramsEl = wrapper.find('.params');

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

  test('concurrent request should not work', async () => {
    mount(
      defineComponent({
        template: '<div/>',
        setup() {
          usePagination(customPropertyApi, {
            // @ts-ignore
            queryKey: () => '1',
          });

          return {};
        },
      }),
    );

    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('`current` and `pageSize` `current` and `pageSize` can modify and can trigger request', async () => {
    let _current = 1;
    let _pageSize = 10;
    const wrapper = mount(
      defineComponent({
        template: '<div/>',
        setup() {
          const { loading, current, pageSize, params } = usePagination(
            normalApi,
          );
          return {
            loading,
            current,
            pageSize,
            params,
            changeCurrent: () => (_pageSize = ++current.value),
            changePageSize: () => (_current = ++pageSize.value),
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
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent,
          } = usePagination(normalApi, {
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

    const paramsEl = wrapper.find('.params');

    expect(JSON.stringify(wrapper.params)).toBe('[]');
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

    expect(JSON.stringify(wrapper.params)).toBe('[]');
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
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent,
          } = usePagination(normalApi, {
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

    expect(JSON.stringify(wrapper.params)).toBe('[]');
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

  // test('global config should work', async () => {
  //   const createComponent = (id: string, requestOptions: GlobalOptions = {}) =>
  //     defineComponent({
  //       setup() {
  //         const { total } = usePagination(customConfigApi, requestOptions);

  //         return () => <div id={id}>{`${total.value}`}</div>;
  //       },
  //     });

  //   const ComponentA = createComponent('A');
  //   const ComponentB = createComponent('B');
  //   const ComponentC = createComponent('C');
  //   const ComponentD = createComponent('D');
  //   const ComponentE = createComponent('E', {
  //     pagination: { totalKey: 'total5' },
  //   });

  //   setGlobalOptions({
  //     pagination: {
  //       totalKey: 'total1',
  //     },
  //   });

  //   const Wrapper = defineComponent({
  //     setup() {
  //       return () => (
  //         <div id="root">
  //           <RequestConfig config={{ pagination: { totalKey: 'total2' } }}>
  //             <ComponentA />
  //           </RequestConfig>

  //           <RequestConfig config={{ pagination: { totalKey: 'total3' } }}>
  //             <ComponentB />

  //             <ComponentE />

  //             {/* nested */}
  //             <RequestConfig config={{ pagination: { totalKey: 'total4' } }}>
  //               <ComponentC />
  //             </RequestConfig>
  //           </RequestConfig>

  //           <ComponentD />
  //         </div>
  //       );
  //     },
  //   });

  //   const wrapper = mount(Wrapper);

  //   expect(wrapper.find('#A').text()).toBe('0');
  //   expect(wrapper.find('#B').text()).toBe('0');
  //   expect(wrapper.find('#C').text()).toBe('0');
  //   expect(wrapper.find('#D').text()).toBe('0');
  //   expect(wrapper.find('#E').text()).toBe('0');

  //   await waitForTime(1000);

  //   expect(wrapper.find('#A').text()).toBe('2');
  //   expect(wrapper.find('#B').text()).toBe('3');
  //   expect(wrapper.find('#C').text()).toBe('4');
  //   expect(wrapper.find('#D').text()).toBe('1');
  //   expect(wrapper.find('#E').text()).toBe('5');
  // });

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
