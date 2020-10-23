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
    const {run, data, loading} = useRequest(testService, {});
    watchEffect(()=>{
      console.log(data);
    })
    return () => <div>
      <button onClick={()=>run()}>aa</button>
      {data}
    </div>;
  },
});
