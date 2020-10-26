import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import useRequest from '..';
import { waitForAll } from './utils';

describe('useRequest', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  const request = (...args: any[]) =>
    new Promise<string>(resolve => {
      setTimeout(() => {
        resolve(args.join(',') || 'success');
      }, 1000);
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

          return () => <button onClick={() => run.value()}>{`data:${data.value}`}</button>;
        },
      }),
    );
    expect(wrapper.vm.$el.textContent).toBe('data:undefined');
    await wrapper.find('button').trigger('click');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('data:success');
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
});
