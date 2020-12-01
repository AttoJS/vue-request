import { defineComponent, PropType, provide } from 'vue';
import { GlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';

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
