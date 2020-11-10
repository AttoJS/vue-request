import { defineComponent, watchEffect } from 'vue';
import useRequest from '../src/index';

function testService() {
  return new Promise<{ name: string; age: number }>(resolve => {
    setTimeout(() => {
      resolve({ name: 'John', age: 18 });
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const { run, data, loading, mutate } = useRequest(testService, {
      debounceInterval: 1000,
      // manual: true,
    });
    // console.log('setup -> run', run);
    // console.log('setup -> data', data);

    watchEffect(() => {
      console.log('data', data.value);
    });
    return () => (
      <div>
        <button
          onClick={() =>
            run.value().then(res => {
              console.log('res', res);
            })
          }
        >
          run
        </button>
        <button
          onClick={() =>
            mutate.value(arg => {
              return {
                name: 'JJ',
                age: 10,
              };
            })
          }
        >
          mutate
        </button>
        <br />
        {loading.value ? 'loading...' : JSON.stringify(data.value)}
      </div>
    );
  },
});
