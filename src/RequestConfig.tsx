import type { PropType } from 'vue';
import { defineComponent, provide } from 'vue';

import { GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';
import type { GlobalOptions } from './core/types';

const RequestConfig = defineComponent({
  name: 'RequestConfig',
  props: {
    config: {
      type: Object as PropType<GlobalOptions>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const { config } = props;

    provide(GLOBAL_OPTIONS_PROVIDE_KEY, config);

    return () => slots.default?.();
  },
});

export default RequestConfig;
