import { mount, shallowMount } from '@vue/test-utils';
import fetchMock from 'fetch-mock';
import Mock from 'mockjs';
import type { GlobalOptions } from 'src/core/types';
import { defineComponent } from 'vue';

import { clearGlobalOptions, setGlobalOptions } from '../core/config';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { RequestConfig, usePagination } from '../index';
import { waitForTime } from './utils';

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
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            data,
            total,
            params,
            current,
            pageSize,
            totalPage,
          } = usePagination<NormalMockDataType>(normalApi);
          return () => (
            <div>
              <div class="result">{JSON.stringify(data.value?.result)}</div>
              <div class="params">{JSON.stringify(params.value)}</div>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const resultEl = wrapper.find('.result');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    expect(resultEl.text()).toBe('');
    expect(currentEl.text()).toBe('1');
    expect(pageSizeEl.text()).toBe('10');
    expect(paramsEl.text()).toBe('[{"current":1,"pageSize":10}]');
    expect(totalEl.text()).toBe('0');
    expect(totalPageEl.text()).toBe('0');

    await waitForTime(1000);
    expect(resultEl.text()).toBe(JSON.stringify(normalMockData.result));
    expect(currentEl.text()).toBe('1');
    expect(pageSizeEl.text()).toBe('10');
    expect(paramsEl.text()).toBe('[{"current":1,"pageSize":10}]');
    expect(totalEl.text()).toBe(`${normalMockData.total}`);
    expect(totalPageEl.text()).toBe('10');
  });

  test('changeCurrent should work', async () => {
    let _current = 1;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changeCurrent,
          } = usePagination(normalApi);
          return () => (
            <div>
              <button
                class="params"
                onClick={() => changeCurrent((_current += 1))}
              >
                {JSON.stringify(params.value)}
              </button>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    for (let index = 0; index < 100; index++) {
      await paramsEl.trigger('click');
      await waitForTime(1000);
      expect(paramsEl.text()).toBe(`[{"current":${_current},"pageSize":10}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe('10');
      expect(totalPageEl.text()).toBe('10');
    }
  });

  test('changePageSize should work', async () => {
    let _pageSize = 10;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const {
            total,
            params,
            current,
            pageSize,
            totalPage,
            changePageSize,
          } = usePagination(normalApi);
          return () => (
            <div>
              <button
                class="params"
                onClick={() => changePageSize((_pageSize += 1))}
              >
                {JSON.stringify(params.value)}
              </button>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    for (let index = 0; index < 100; index++) {
      await paramsEl.trigger('click');
      await waitForTime(1000);
      expect(paramsEl.text()).toBe(`[{"current":1,"pageSize":${_pageSize}}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe('1');
      expect(pageSizeEl.text()).toBe(`${_pageSize}`);
      expect(totalPageEl.text()).toBe(`${Math.ceil(100 / _pageSize)}`);
    }
  });

  test('custom pagination property should work', async () => {
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <div class="params">{JSON.stringify(params.value)}</div>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    await waitForTime(1000);
    expect(paramsEl.text()).toBe('[{"myCurrent":1,"myPageSize":10}]');
    expect(totalEl.text()).toBe('100');
    expect(currentEl.text()).toBe('1');
    expect(pageSizeEl.text()).toBe('10');
    expect(totalPageEl.text()).toBe('99');
  });

  test('concurrent request should not work', async () => {
    const fn = jest.fn();

    shallowMount(
      defineComponent({
        setup() {
          try {
            usePagination(customPropertyApi, {
              // @ts-ignore
              queryKey: () => '1',
            });
          } catch (error) {
            expect(error.message).toBe(
              'usePagination does not support concurrent request',
            );
            fn();
          }
          return () => <div />;
        },
      }),
    );

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('`current` and `pageSize` `current` and `pageSize` can modify and can trigger request', async () => {
    let _current = 1;
    let _pageSize = 10;
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { loading, current, pageSize, params } = usePagination(
            normalApi,
          );
          return () => (
            <div>
              <button
                class="currentBtn"
                onClick={() => (_current = ++current.value)}
              />
              <button
                class="pageSizeBtn"
                onClick={() => (_pageSize = ++pageSize.value)}
              />
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="loading">{`${loading.value}`}</div>
              <div class="params">{JSON.stringify(params.value)}</div>
            </div>
          );
        },
      }),
    );

    const currentBtn = wrapper.find('.currentBtn');
    const pageSizeBtn = wrapper.find('.pageSizeBtn');
    const currentEl = wrapper.find('.current');
    const paramsEl = wrapper.find('.params');
    const pageSizeEl = wrapper.find('.pageSize');
    const loadingEl = wrapper.find('.loading');

    for (let index = 0; index < 100; index++) {
      await currentBtn.trigger('click');
      expect(loadingEl.text()).toBe('true');
      await waitForTime(1000);
      expect(loadingEl.text()).toBe('false');
      expect(paramsEl.text()).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe(`${_pageSize}`);
    }

    for (let index = 0; index < 100; index++) {
      await pageSizeBtn.trigger('click');
      expect(loadingEl.text()).toBe('true');
      await waitForTime(1000);
      expect(loadingEl.text()).toBe('false');
      expect(paramsEl.text()).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe(`${_pageSize}`);
    }
  });

  test('`reload` should work', async () => {
    let _current = 1;
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <div class="params">{JSON.stringify(params.value)}</div>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
              <div class="reloading">{`${reloading.value}`}</div>
              <div class="reload" onClick={() => reload()} />
              <div class="next" onClick={() => (current.value = ++_current)} />
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');
    const reloadingEl = wrapper.find('.reloading');
    const reloadEl = wrapper.find('.reload');
    const nextEl = wrapper.find('.next');

    await waitForTime(1000);
    for (let index = 0; index < 100; index++) {
      await nextEl.trigger('click');
      expect(reloadingEl.text()).toBe('false');
      await waitForTime(1000);
      expect(reloadingEl.text()).toBe('false');
      expect(paramsEl.text()).toBe(`[{"current":${_current},"pageSize":10}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe('10');
      expect(totalPageEl.text()).toBe('10');
    }

    await reloadEl.trigger('click');
    expect(reloadingEl.text()).toBe('true');
    _current = 1;
    await waitForTime(1000);
    expect(reloadingEl.text()).toBe('false');
    expect(paramsEl.text()).toBe(`[{"current":${_current},"pageSize":10}]`);
    expect(totalEl.text()).toBe('100');
    expect(currentEl.text()).toBe(`${_current}`);
    expect(pageSizeEl.text()).toBe('10');
    expect(totalPageEl.text()).toBe('10');

    for (let index = 0; index < 100; index++) {
      await nextEl.trigger('click');
      expect(reloadingEl.text()).toBe('false');
      await waitForTime(1000);
      expect(reloadingEl.text()).toBe('false');
      expect(paramsEl.text()).toBe(`[{"current":${_current},"pageSize":10}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe('10');
      expect(totalPageEl.text()).toBe('10');
    }
  });

  test('changeCurrent should work', async () => {
    let _current = 1;
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button
                class="params"
                onClick={() => changeCurrent((_current += 1))}
              >
                {JSON.stringify(params.value)}
              </button>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    expect(paramsEl.text()).toBe('[]');
    expect(totalEl.text()).toBe('0');
    expect(currentEl.text()).toBe('1');
    expect(pageSizeEl.text()).toBe('10');
    expect(totalPageEl.text()).toBe('0');

    for (let index = 0; index < 100; index++) {
      await paramsEl.trigger('click');
      await waitForTime(1000);

      expect(paramsEl.text()).toBe(`[{"current":${_current}}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe('10');
      expect(totalPageEl.text()).toBe('10');
    }
  });

  test('changePagination should work', async () => {
    let _current = 1;
    let _pageSize = 1;
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button
                class="params"
                onClick={() => {
                  _current += 1;
                  _pageSize += 1;
                  changePagination(_current, _pageSize);
                }}
              >
                {JSON.stringify(params.value)}
              </button>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    expect(paramsEl.text()).toBe('[]');
    expect(totalEl.text()).toBe('0');
    expect(currentEl.text()).toBe(`${_current}`);
    expect(pageSizeEl.text()).toBe('10');
    expect(totalPageEl.text()).toBe('0');

    for (let index = 0; index < 100; index++) {
      await paramsEl.trigger('click');
      await waitForTime(1000);

      expect(paramsEl.text()).toBe(
        `[{"current":${_current},"pageSize":${_pageSize}}]`,
      );
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe(`${_pageSize}`);
      expect(totalPageEl.text()).toBe(`${Math.ceil(100 / _pageSize)}`);
    }
  });

  test('manual should work with defaltParams', async () => {
    let _current = 1;
    const wrapper = shallowMount(
      defineComponent({
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
          return () => (
            <div>
              <button
                class="params"
                onClick={() => changeCurrent((_current += 1))}
              >
                {JSON.stringify(params.value)}
              </button>
              <div class="total">{total.value}</div>
              <div class="current">{current.value}</div>
              <div class="pageSize">{pageSize.value}</div>
              <div class="totalPage">{totalPage.value}</div>
            </div>
          );
        },
      }),
    );

    const paramsEl = wrapper.find('.params');
    const totalEl = wrapper.find('.total');
    const currentEl = wrapper.find('.current');
    const pageSizeEl = wrapper.find('.pageSize');
    const totalPageEl = wrapper.find('.totalPage');

    expect(paramsEl.text()).toBe('[]');
    expect(totalEl.text()).toBe('0');
    expect(currentEl.text()).toBe('2');
    expect(pageSizeEl.text()).toBe('20');
    expect(totalPageEl.text()).toBe('0');

    for (let index = 0; index < 100; index++) {
      await paramsEl.trigger('click');
      await waitForTime(1000);

      expect(paramsEl.text()).toBe(`[{"current":${_current}}]`);
      expect(totalEl.text()).toBe('100');
      expect(currentEl.text()).toBe(`${_current}`);
      expect(pageSizeEl.text()).toBe('20');
      expect(totalPageEl.text()).toBe('5');
    }
  });

  test('global config should work', async () => {
    const createComponent = (id: string, requestOptions: GlobalOptions = {}) =>
      defineComponent({
        setup() {
          const { total } = usePagination(customConfigApi, requestOptions);

          return () => <div id={id}>{`${total.value}`}</div>;
        },
      });

    const ComponentA = createComponent('A');
    const ComponentB = createComponent('B');
    const ComponentC = createComponent('C');
    const ComponentD = createComponent('D');
    const ComponentE = createComponent('E', {
      pagination: { totalKey: 'total5' },
    });

    setGlobalOptions({
      pagination: {
        totalKey: 'total1',
      },
    });

    const Wrapper = defineComponent({
      setup() {
        return () => (
          <div id="root">
            <RequestConfig config={{ pagination: { totalKey: 'total2' } }}>
              <ComponentA />
            </RequestConfig>

            <RequestConfig config={{ pagination: { totalKey: 'total3' } }}>
              <ComponentB />

              <ComponentE />

              {/* nested */}
              <RequestConfig config={{ pagination: { totalKey: 'total4' } }}>
                <ComponentC />
              </RequestConfig>
            </RequestConfig>

            <ComponentD />
          </div>
        );
      },
    });

    const wrapper = mount(Wrapper);

    expect(wrapper.find('#A').text()).toBe('0');
    expect(wrapper.find('#B').text()).toBe('0');
    expect(wrapper.find('#C').text()).toBe('0');
    expect(wrapper.find('#D').text()).toBe('0');
    expect(wrapper.find('#E').text()).toBe('0');

    await waitForTime(1000);

    expect(wrapper.find('#A').text()).toBe('2');
    expect(wrapper.find('#B').text()).toBe('3');
    expect(wrapper.find('#C').text()).toBe('4');
    expect(wrapper.find('#D').text()).toBe('1');
    expect(wrapper.find('#E').text()).toBe('5');
  });

  test('onBefore and onAfter hooks can use in `usePagination`', async () => {
    const onBefore = jest.fn();
    const onAfter = jest.fn();

    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { changeCurrent } = usePagination<NormalMockDataType>(
            normalApi,
            {
              onBefore,
              onAfter,
            },
          );
          return () => (
            <div>
              <button class="button" onClick={() => changeCurrent(1)} />
            </div>
          );
        },
      }),
    );

    const buttonEl = wrapper.find('.button');

    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(0);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(1);
    expect(onAfter).toHaveBeenCalledTimes(1);

    await buttonEl.trigger('click');
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(1);
    await waitForTime(1000);
    expect(onBefore).toHaveBeenCalledTimes(2);
    expect(onAfter).toHaveBeenCalledTimes(2);
  });
});
