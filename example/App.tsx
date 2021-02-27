import { defineComponent, watchEffect } from 'vue';
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
  return new Promise<APIReturnType>(resolve => {
    setTimeout(() => {
      resolve(api((rawData?.data.current || 0) + 1));
    }, 1000);
  });
}

export default defineComponent({
  name: 'App',
  setup() {
    const { loadMore, loadingMore, dataList, noMore } = useLoadMore(
      testService,
      {
        isNoMore: d => d?.current > d?.total,
        formatResult: d => d.list,
      },
    );

    return () => (
      <div>
        <button
          disabled={noMore.value}
          onClick={() => {
            loadMore();
          }}
        >
          run
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
