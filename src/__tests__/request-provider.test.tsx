import { defineComponent, h, inject } from 'vue-demi';

import { GLOBAL_OPTIONS_PROVIDE_KEY } from '../core/config';
import { useRequestProvider } from '../index';
import { mount } from './utils';

describe('useRequestProvider', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  test('should be defined', () => {
    expect(useRequestProvider).toBeDefined();
  });

  test('useRequestProvider should work', async () => {
    const ChildComponent = defineComponent({
      template: `<div />`,
      setup() {
        const data = inject(GLOBAL_OPTIONS_PROVIDE_KEY, {});
        expect(data.manual).toBe(true);
        return {};
      },
    });

    const RootComponent = defineComponent({
      setup() {
        useRequestProvider({
          manual: true,
        });

        return {};
      },
      render() {
        return h(ChildComponent);
      },
    });

    mount(RootComponent);
  });
});
