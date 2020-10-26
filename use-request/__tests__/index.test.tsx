import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import useRequest from '..';
import { waitForAll } from './utils';

describe('useRequest', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  const request = () =>
    new Promise<string>(resolve => {
      setTimeout(() => {
        resolve('success');
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

          return () => <div>{data.value}</div>;
        },
      }),
    );
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('success');
  });

  test('should mutate work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { data, mutate } = useRequest(request);

          return () => <div onClick={() => mutate.value('ok')}>{data.value}</div>;
        },
      }),
    );
    await wrapper.find('div').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('ok');
  });

  test('should refresh work', async () => {
    const wrapper = shallowMount(
      defineComponent({
        setup() {
          const { refresh, loading } = useRequest(request);

          return () => <div onClick={() => refresh.value()}>{`loading, ${loading.value}`}</div>;
        },
      }),
    );
    await wrapper.find('div').trigger('click');
    expect(wrapper.vm.$el.textContent).toBe('loading, true');
    await waitForAll();
    expect(wrapper.vm.$el.textContent).toBe('loading, false');
  });
});
