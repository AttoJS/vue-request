import { defineComponent, watchEffect } from 'vue';
import useRequest from '../use-request';

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
    const { run, data, loading } = useRequest(testService, {});
    // console.log('setup -> run', run);
    // console.log('setup -> data', data);

    watchEffect(() => {
      console.log('data', data);
    });
    return () => (
      <div>
        <button onClick={() => run.value()}>aa</button>
        {data.value}
      </div>
    );
  },
});
