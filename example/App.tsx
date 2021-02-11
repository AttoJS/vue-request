import axios from 'axios';
import { defineComponent, watchEffect } from 'vue';
import { usePagination } from 'vue-request';

type APIParams = {
  results: number;
  page?: number;
  sortField?: string;
  sortOrder?: number;
  [key: string]: any;
};
type APIResult = {
  results: {
    gender: 'female' | 'male';
    name: string;
    email: string;
  }[];
};

const queryData = (params: APIParams) => {
  return axios.get<APIResult>('https://randomuser.me/api', { params: params });
};

let index = 1;
export default defineComponent({
  name: 'App',
  setup() {
    const {
      // @ts-ignore
      changeCurrent,
      // @ts-ignore
      changePageSize,
      data,
      loading,
      // @ts-ignore
      current,
      // @ts-ignore
      pageSize,
      // @ts-ignore
      total,
      // @ts-ignore
      totalPage,
      // @ts-ignore
    } = usePagination(queryData, {
      formatResult: data => data.data,
      pagination: {
        // @ts-ignore
        currentKey: 'page',
        pageSizeKey: 'results',
        totalKey: 'results.0.dob.age',
        totalPageKey: 'results.0.registered.age',
      },
    });
    watchEffect(() => {
      console.log(data.value);
    });
    return () => (
      <div>
        <button onClick={() => changeCurrent((index += 1))}>
          changeCurrent
        </button>
        <button onClick={() => changePageSize((index += 1))}>
          changePageSize
        </button>
        <br />
        current: {current.value}, pageSize: {pageSize.value}, total:{' '}
        {total.value}, totalPage: {totalPage.value}
        <br />
        <br />
        {loading.value ? 'loading...' : JSON.stringify(data.value)}
      </div>
    );
  },
});
