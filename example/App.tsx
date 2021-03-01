import { defineComponent, reactive, watchEffect } from 'vue';
import { useLoadMore } from 'vue-request';
import Mock from 'mockjs';

function api(current: number, total = 10) {
  let list: string[] = [];
  if (current <= total) {
    list = Mock.mock({
      'list|5': ['@name'],
    }).list;
  } else {
    list = [];
  }
  return {
    current,
    total,
    list,
  };
}
type APIReturnType = ReturnType<typeof api>;
type rawDataType = {
  data: APIReturnType;
  dataList: APIReturnType['list'];
};

function testService(rawData: rawDataType) {
  const current = (rawData?.data?.current || 0) + 1;
  console.log(`${current}`, rawData);

  return new Promise<APIReturnType>(resolve => {
    setTimeout(() => {
      resolve(api(current));
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const { loadMore, loadingMore, dataList, noMore, reload } = useLoadMore<
      APIReturnType,
      any,
      APIReturnType['list']
    >(testService, {
      isNoMore: d => {
        return d?.current >= d?.total;
      },
    });

    const testReactive = reactive({ first: 'init' });

    watchEffect(() => {
      console.log(testReactive);
    });

    return () => (
      <div>
        <button
          disabled={noMore.value}
          onClick={() => {
            loadMore();
            Object.keys(testReactive).forEach(key => {
              testReactive[key] = new Date();
            });
          }}
        >
          run
        </button>

        <button
          onClick={() => {
            reload();
          }}
        >
          reload
        </button>
        <br />
        {loadingMore.value
          ? 'loading...'
          : dataList.value?.map((i, idx) => (
              <div key={idx}>
                <h4 style="display: inline-block">{idx}</h4>: {i}
              </div>
            ))}
      </div>
    );
  },
});
