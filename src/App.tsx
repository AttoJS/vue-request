import { defineComponent, watchEffect } from 'vue';
import useRequest from '../use-request';

function testService(): Promise<any> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({name: 'John', age: 18});
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const { run, data, loading, mutate } = useRequest<any, {
      name: string;
      age: number
    }>(testService, {});
    // console.log('setup -> run', run);
    // console.log('setup -> data', data);

    watchEffect(() => {
      console.log('data', data.value);
    });
    return () => (
      <div>
        <button onClick={() => run.value()}>run</button>
        <button
          onClick={() =>
            mutate.value(arg => {
              return {
                name: 'JJ',
                age: 10
              }
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
