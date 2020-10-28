import { defineComponent, ref, watchEffect } from 'vue';
import useRequest from '../use-request';

function testService(): Promise<any> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ name: 'John', age: 18 });
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const readyRef = ref(false);

    const options = { ready: readyRef };

    watchEffect(() => {
      console.log('reaciveOps ready', readyRef.value);
    });

    const changeReady = () => {
      options.ready.value = true;
    };

    const { run, data, loading, mutate } = useRequest<
      {
        name: string;
        age: number;
      },
      any
    >(testService, { ready: readyRef });

    watchEffect(() => {
      console.log('data', data.value);
    });

    return () => (
      <div>
        {options.ready.value.toString()}
        <button onClick={changeReady}>changeReady</button>
        <button onClick={() => run.value()}>run</button>
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
