import { mount } from '@vue/test-utils';
import { RequestConfig } from '../index';
import { defineComponent } from 'vue';

describe('RequestConfig', () => {
  const Child = defineComponent({
    setup() {
      return () => <button>button</button>;
    },
  });
  it('RequestConfig default slots should work ', () => {
    const wrapperA = mount(
      defineComponent({
        setup() {
          return () => (
            <RequestConfig config={{ loadingDelay: 0 }}>
              this is a text
            </RequestConfig>
          );
        },
      }),
    );
    expect(wrapperA.html()).toMatchSnapshot();
    wrapperA.unmount();

    const wrapperB = mount(
      defineComponent({
        setup() {
          return () => (
            <RequestConfig config={{ loadingDelay: 0 }}>
              this is a text
              <Child />
            </RequestConfig>
          );
        },
      }),
    );
    expect(wrapperB.html()).toMatchSnapshot();
  });
});
