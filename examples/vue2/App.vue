<template>
  <div>
    <button @click="() => run()">run</button>
    <br />
    {{ loading ? 'loading...' : data }}
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { useRequest } from 'vue-request';
function testService() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('success');
    }, 1000);
  });
}

export default defineComponent({
  setup() {
    const { run, data, loading } = useRequest(testService);
    return {
      run,
      data,
      loading,
    };
  },
});
</script>
