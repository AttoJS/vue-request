import { useRequest } from 'vue-request';
import { defineComponent } from 'vue3';

function testService() {
  return new Promise<string>(resolve => {
    setTimeout(() => {
      resolve('success');
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const { run, data, loading } = useRequest(testService);
    return () => (
      <div>
        <button onClick={() => run()}>run</button>
        <br />
        {loading.value ? 'loading...' : data.value}
      </div>
    );
  },
});
