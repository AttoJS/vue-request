import useRequest from '../use-request';
import { defineComponent, watchEffect } from 'vue';

function testService(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('test');
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    // @ts-ignore
    const {  data , state} = useRequest(testService, {});
    watchEffect(() => {
      console.log('watch data', data.text);
    });
    return () => (
      <div>
        <button onClick={() => state.run()}>aa</button>
        {state.loading ? '加载中...' : data.text}
      </div>
    );
  },
});
