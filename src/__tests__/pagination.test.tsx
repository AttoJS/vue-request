import { mount, shallowMount } from '@vue/test-utils';
import fetchMock from 'fetch-mock';
import Mock from 'mockjs';
import { defineComponent, reactive, Ref, ref, watchEffect } from 'vue';
import {
  clearGlobalOptions,
  GlobalOptions,
  setGlobalOptions,
} from '../core/config';
import {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { usePagination, RequestConfig } from '../index';
import { waitForAll, waitForTime } from './utils';
import { failedRequest } from './utils/request';
declare let jsdom: any;

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

  fetchMock.get(normalApi, normalMockData);
  fetchMock.get(customPropertyApi, customPropertyMockData);

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
      paramsEl.trigger('click');
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
      paramsEl.trigger('click');
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
          const {
            data,
            total,
            params,
            current,
            pageSize,
            totalPage,
          } = usePagination(customPropertyApi, {
            pagination: {
              currentKey: 'myCurrent',
              pageSizeKey: 'myPageSize',
              totalKey: 'myTotal.a.b.total',
              totalPageKey: 'myTotalPage.a.b.totalPage',
            },
          });
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
});
