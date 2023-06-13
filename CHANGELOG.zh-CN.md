# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.3](https://github.com/attojs/vue-request/compare/v2.0.2...v2.0.3) (2023-06-13)

### Refactor

- 导出 `definePlugin` 方法 ([2a03d38](https://github.com/attojs/vue-request/commit/2a03d38b279c0a9e2753248a3ab657c82bf19144))

### [2.0.2](https://github.com/attojs/vue-request/compare/v2.0.1...v2.0.2) (2023-06-02)

### Refactor

- 添加 可选链语法 的转换 [#199](https://github.com/attojs/vue-request/issues/199) ([f1c79fb](https://github.com/AttoJS/vue-request/commit/f1c79fbafa103c3fe0048b4756123d431bb92809))

### [2.0.1](https://github.com/attojs/vue-request/compare/v1.2.4...v2.0.1) (2023-06-01)

## 变更列表

- 使用 `vue-demi` 兼容 vue2 #38
- 新增自定义缓存 `getCache` 、`setCache` 和 `clearCache`。
- 开启缓存的情况下，设置了相同 `cacheKey` 的请求将会被缓存和复用。
- 新增 `runAsync` 和 `refreshAsync`，将返回 `Promise`。
- 新增 `definePlugin`，可以通过插件来扩展 useRequest 的功能。
- 节流/防抖模式下可以使用 `runAsync` 返回正常的 `Promise`。
- 新增 `useRequestProvider` hooks，用于注入 options 配置。
- 新增 `refreshDepsAction` 选项，用于自定义 `refreshDeps` 触发后的行为。
- `refreshDepsAction` 在 `manual=true` 时，也会被 `refreshDeps` 的改变而触发。
- 新增 `loadingKeep`。
- **移除 内部集成请求库，`service` 不再支持字符或对象。** [迁移帮助](#1)
- **移除 `formatResult`。** [迁移帮助](#2)
- **移除 `queryKey`，即移除了并行模式** [迁移帮助](#3)
- **`run` 不再返回 `Promise`** [迁移帮助](#5)
- **请求出错时，`data` 不再会被清空**#82
- **修改 `ready` 的逻辑** [迁移帮助](#4)
- **`ready` 支持传入一个返回布尔值的函数** #166
- **`data` 和 `error` 改为 `shallowRef`**
- **`usePagination` 移除了 `reload` 方法和 `reloading`。如需要对应的需求，可自行实现。**
- **移除了 `RequestConfig` 组件** [迁移帮助](#6)
- **重构了`useLoadMore`，具体 API 可查看详情** [API 说明](#useloadmore-api)
- **`cacheKey` 支持传入函数: `cacheKey: (params?: P) => string`**
  ```ts
  useRequest(getUser,{
    cacheKey: (params?:P):string => {
      <!-- 初始化时，params 会为 undefined，需要手动判断并返回一个空字符串 -->
      if(params){
        return `user-key-${params[0].name}`
      }
      return ''
    }
  })
  ```
- 部分`options` 支持响应式，如下所示

  ```ts
  type ReactivityOptions = {
    loadingDelay: number | Ref<number>;
    loadingKeep: number | Ref<number>;
    pollingInterval: number | Ref<number>;
    debounceInterval: number | Ref<number>;
    debounceOptions: DebounceOptions | Reactive<DebounceOptions>;
    throttleInterval: number | Ref<number>;
    throttleOptions: ThrottleOptions | Reactive<ThrottleOptions>;
    refreshOnWindowFocus: boolean | Ref<boolean>;
    refocusTimespan: number | Ref<number>;
    errorRetryCount: number | Ref<number>;
    errorRetryInterval: number | Ref<number>;
  };
  ```

- **`refreshDeps`支持传入 一个函数，返回一个值 、是一个 ref 、一个响应式对象 或是由以上类型的值组成的数组** #166

## 迁移帮助

1. `service` 不再支持字符或对象。期望用户可以根据其他第三方请求库进行封装（如 `axios`），只要提供 `Promise` 即可 <a name="1"></a>

```js
const getUser = userName => {
  return axios.get('api/user', {
    params: {
      name: userName,
    },
  });
};
useRequest(getUser, options);
```

2. 移除 `formatResult`。期望用户自行在 `service` 中返回最终格式的数据。 <a name="2"></a>

```js
const getUser = async () => {
  const results = await axios.get('api/user');
  // 在此处处理最终的数据
  return results.data;
};
```

3. 移除 `queryKey`，即移除了并行模式。期望将每个请求动作和 UI 封装为一个组件，而不是把所有请求都放到父级。 <a name="3"></a>

4. 修改 `ready` 的逻辑 <a name="4" /></a>

   - 当 `manual=false` 时，每次 `ready` 从 `false` 变为 `true` 时，都会自动发起请求，会带上参数 `options.defaultParams`。
   - 当 `manual=true` 时，只要 `ready`为 `false`，则无法发起请求。

5. `run` 不再返回 `Promise`。直接用 `runAsync` 替代原本的 `run`。 <a name="5" /></a>
6. 可自行通过 `useRequestProvider` 封装 。<a name="6" /></a>

## useLoadMore API

### Options

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| manual | 当设置为 `true` 时，你需要手动触发 `loadMore` 或者 `loadMoreAsync` 才会发起请求。默认为 `false` | `boolean` |
| ready | 当 `manual=false` 时，每次 `ready` 从 `false` 变为 `true` 时，都会自动触发 `refresh`。当 `manual=true` 时，只要 `ready` 为 `false`，则无法发起请求。 | `Ref<boolean> \| () => boolean` |
| refreshDeps | 改变后自动触发 `refresh`，如果设置了 `refreshDepsAction` 则触发 `refreshDepsAction` | `WatchSource<any> \| WatchSource<any>[]` |
| refreshDepsAction | `refreshDeps`改变后触发 | `() => void` |
| debounceInterval | 以防抖策略处理请求 | `number \| Ref<number>` |
| debounceOptions | 防抖参数 | `{leading: false, maxWait: undefined, trailing: true}` |
| throttleInterval | 以节流策略处理请求 | `number \| Ref<number>` |
| throttleOptions | 节流参数 | `{leading: false, trailing: true}` |
| errorRetryCount | 发生错误时的错误重试次数 | `number \| Ref<number>` |
| errorRetryInterval | 发生错误时的错误重试间隔时间 | `number \| Ref<number>` |
| isNoMore | 判断是否还有更多数据 | `(data?: R) => boolean` |
| onBefore | service 执行前触发 | `() => void` |
| onAfter | service 执行完成时触发 | `() => void` |
| onSuccess | service resolve 时触发 | `(data: R) => void` |
| onError | service reject 时触发 | `(error: Error) => void` |

### Result

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| data | service 返回的数据，必须包含 `list` 数组，类型为 `{ list: any[], ...other }` | `Ref<R>` |
| dataList | `data` 的 `list` 数组 | `Ref<R['list']>` |
| loading | 是否正在进行请求 | `Ref<boolean>` |
| loadingMore | 是否正在加载更多 | `Ref<boolean>` |
| noMore | 是否有更多数据，需要配合 `options.isNoMore` 使用 | `Ref<boolean>` |
| error | service 返回的错误 | `Error` |
| loadMore | 加载更多数据，会自动捕获异常，通过 `options.onError` 处理 | `() => void` |
| loadMoreAsync | 加载更多数据，返回 `Promise`，需要自行处理错误 | `() => Promise<R>` |
| refresh | 刷新加载第一页数据，会自动捕获异常，通过 `options.onError` 处理 | `() => void` |
| refreshAsync | 刷新加载第一页数据，返回 `Promise`，需要自行处理错误 | `() => Promise<R>` |
| mutate | 直接修改 `data` 的结果 | `(arg: (oldData: R) => R) => void \| (newData: R) => void` |
| cancel | 取消请求 | `() => void` |

### [1.2.4](https://github.com/attojs/vue-request/compare/v1.2.3...v1.2.4) (2022-01-21)

### Refactor

- 使用 UMD 替换 IIFE modules ([2f05be8](https://github.com/AttoJS/vue-request/commit/2f05be83238416437c87a5b5bdaea4a87f982e88))

### [1.2.3](https://github.com/attojs/vue-request/compare/v1.2.2...v1.2.3) (2021-10-12)

### Bug Fixes

- 修复错误的 import 路径 [#71](https://github.com/attojs/vue-request/issues/71) ([#72](https://github.com/attojs/vue-request/issues/72)) ([2926510](https://github.com/attojs/vue-request/commit/2926510db896205bdaf597bb5b28d8c9efcbffdd))

### [1.2.2](https://github.com/attojs/vue-request/compare/v1.2.1...v1.2.2) (2021-10-06)

### Bug Fixes

- 修复 nullish 操作符没有没转换的问题

### [1.2.1](https://github.com/attojs/vue-request/compare/v1.2.0...v1.2.1) (2021-10-06)

### Features

- 防抖和节流模式现在支持配置触发时机 [#63](https://github.com/attojs/vue-request/issues/63) ([decbbd3](https://github.com/attojs/vue-request/commit/decbbd3a2da5e559556126c6ed1166415ce87c06))

## [1.2.0](https://github.com/attojs/vue-request/compare/v1.1.1...v1.2.0) (2021-05-22)

### Features

- **usePagination:** 新增 `changePagination()` 方法，用来同时修改 `current` 和 `pageSize` [#43](https://github.com/attojs/vue-request/issues/43) ([c3822f0](https://github.com/attojs/vue-request/commit/c3822f0fe0d579dc1b534c6e9c6845dc6ca3f0f1))
- 新增 `onBefore()` 和 `onAfter()` 钩子 [#42](https://github.com/attojs/vue-request/issues/42) ([135e76f](https://github.com/attojs/vue-request/commit/135e76f06ee9605e5a0a64f6def363df36bf7947))
- 新增 `reloading` 用于记录 `reload()` 是否正在触发 [#41](https://github.com/attojs/vue-request/issues/41) ([5034f2c](https://github.com/attojs/vue-request/commit/5034f2c7110e16d63b824793dc57ebea27e15ae8))

### Performance Improvements

- 包体积优化，整体体积减少 **88%** [#44](https://github.com/attojs/vue-request/issues/44) ([6a5b074](https://github.com/attojs/vue-request/commit/6a5b074de77bd3dbbf1150e8db202ee5fc1c59dc), [ffbc5d1](https://github.com/attojs/vue-request/commit/ffbc5d1e49f99ffa52106085f90117095fa884b6), [ce233ca](https://github.com/attojs/vue-request/commit/ce233ca74c81507ed3177576674d495054d155b7), [#45](https://github.com/attojs/vue-request/issues/45)([4272062](https://github.com/attojs/vue-request/commit/4272062f2a160f4ca3dd01bdee42bef263a132c7)))

### ⚠ BREAKING CHANGES

- not support IE11 [#44](https://github.com/attojs/vue-request/issues/44) ([686e4cd](https://github.com/attojs/vue-request/commit/686e4cdcf802a08af9590088dceaebd2d9249671))

## [1.1.1](https://github.com/attojs/vue-request/compare/v1.1.0...v1.1.1) (2021-04-28)

### Bug Fixes

- **usePagination:** `defaultParams.current` 和 `defaultParams.pageSize` 在 `manual: true` 时应该能正常传递给 `current` 和 `pageSize` ([3ca5fd7](https://github.com/attojs/vue-request/commit/3ca5fd7749a2aafb723797e299df5c6a8bd0e37f)), closes [#40](https://github.com/attojs/vue-request/issues/40)

## [1.1.0](https://github.com/attojs/vue-request/compare/v1.0.5...v1.1.0) (2021-04-19)

### Features

- **useLoadMore:** 重构 `useLoadMore` 的 `refresh` 和 `cancel` 方法，添加了 `refreshing` 用于记录是否正在刷新 [#36](https://github.com/attojs/vue-request/issues/36) ([7c34351](https://github.com/attojs/vue-request/commit/7c34351fbc8dad763effb33f4bd7b9e4cb18b9d6))

### Bug Fixes

- 在使用 `queryKey` 后，根级别的 `refresh`, `mutate`, `cancel` 无法正常工作 [#37](https://github.com/attojs/vue-request/issues/37) ([66b3198](https://github.com/attojs/vue-request/commit/66b31981353fee5c9ebda806bbbeccef4bf6e4c3))

### ⚠ BREAKING CHANGES

- **useLoadMore:** 移除 `useLoadMore` 里的 `mutate` 方法 ([b935bcd](https://github.com/attojs/vue-request/commit/b935bcd01629b38ba068e82ca062380b6434c85f))

## [1.0.5](https://github.com/attojs/vue-request/compare/v1.0.4...v1.0.5) (2021-03-22)

### Bug Fixes

- `onSuccess` 的 `data` 类型不正确 ([407ed11](https://github.com/attojs/vue-request/commit/407ed116ebed813e1f07cede97ad2285281e76ba)), closes [#31](https://github.com/attojs/vue-request/issues/31)
- 错误的 import 路径 ([0a31504](https://github.com/attojs/vue-request/commit/0a315040a1e38cbb9b8cb877b912fbde091f471c)), closes [#33](https://github.com/attojs/vue-request/issues/33)

## [1.0.4](https://github.com/attojs/vue-request/compare/v1.0.3...v1.0.4) (2021-03-08)

### Bug Fixes

- 修复 `useLoadMore` 类型 ([0e673bf](https://github.com/attojs/vue-request/commit/0e673bffb683164bfad6c58b4aa58c7d7734428e))

## [1.0.3](https://github.com/attojs/vue-request/compare/v1.0.0-beta.11...v1.0.3) (2021-03-06)

### Bug Fixes

- 并发请求应该有单独的事件监听 ([7511720](https://github.com/attojs/vue-request/commit/7511720223ed9e620339e4d61be46426464feb10))

### Features

- `usePagination` 和 `useLoadMore` 支持全局配置 ([8cceb1e](https://github.com/attojs/vue-request/commit/8cceb1e44aae6943d9303ecc38a4d7f2e582498e))
- **usePagination:** 添加 `reload` 方法用来重置分页信息 ([def45e3](https://github.com/attojs/vue-request/commit/def45e37998e2951cfa78600a58595c2f85969d4))
- **useRequest:** 添加 `reload` 方法用来清空 `queries` 列表 ([b64216b](https://github.com/attojs/vue-request/commit/b64216bc264e775f214c1c574ffb8df948521c53))

## [1.0.0-beta.11](https://github.com/attojs/vue-request/compare/v1.0.0-beta.10...v1.0.0-beta.11) (2021-03-03)

### Features

- 添加 `useLoadMore` loadMore 扩展 ([#28](https://github.com/attojs/vue-request/issues/28)) ([6f986b2](https://github.com/AttoJS/vue-request/commit/6f986b273d1380dd26ddac19926dbabbdbef3760))

## [1.0.0-beta.10](https://github.com/attojs/vue-request/compare/v1.0.0-beta.9...v1.0.0-beta.10) (2021-03-02)

### ⚠ BREAKING CHANGES

- `queries` 由 `shallowReactive` 对象，修改为 `reactive` 对象 ([8f940a4](https://github.com/attojs/vue-request/commit/8f940a4e8eece210d382c8fed00303b2ebe9d26f))

## [1.0.0-beta.9](https://github.com/attojs/vue-request/compare/v1.0.0-beta.8...v1.0.0-beta.9) (2021-02-26)

### ⚠ BREAKING CHANGES

- **usePagination:** 分页扩展 不再支持 并发请求 ([2c083ef](https://github.com/attojs/vue-request/commit/2c083ef1ab5319947a7db6d86110f65da569085e))

### Refactor

- **usePagination:** `current` 和 `pageSize` 能够被修改并且能同时触发请求，意味着你可以直接使用 `v-model` 来绑定它们 ([ea5a238](https://github.com/attojs/vue-request/commit/ea5a23876322e744c0998ae5bfd787e93bd66e1f))

## [1.0.0-beta.8](https://github.com/attojs/vue-request/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2021-02-24)

### Features

- 添加 `usePagination` 分页扩展 ([#26](https://github.com/attojs/vue-request/issues/26)) ([bc21ed2](https://github.com/attojs/vue-request/commit/bc21ed2f42ce2307a69a758de9b741fb18dd0a6c))

## [1.0.0-beta.7](https://github.com/AttoJS/vue-request/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2021-01-11)

### Feature

- 更加智能的 `errorRetryInterval` 算法 （[#19](https://github.com/AttoJS/vue-request/pull/19)) [13ce153](https://github.com/AttoJS/vue-request/commit/13ce153f5eaafab8d9ffdfac5ec771f35142df23)

## [1.0.0-beta.6](https://github.com/attojs/vue-request/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2020-12-31)

### Refactor

- 添加 `isServer` 用于兼容 node 环境 [4f1c797](https://github.com/AttoJS/vue-request/commit/4f1c7971bed7eb45c68a1d9ae89a2134a29cd7aa)
- 修改 `cacheTime` 默认值为 10 分钟 [a56ecb0](https://github.com/AttoJS/vue-request/commit/a56ecb012dea93996bf61a2bc4228cd7a7f98a42)

## [1.0.0-beta.5](https://github.com/attojs/vue-request/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2020-12-14)

### Bug Fixes

- babel 支持 .tsx 扩展名 ([#15](https://github.com/AttoJS/vue-request/issues/15)) [c7d8c3d](https://github.com/AttoJS/vue-request/commit/c7d8c3de463dc50c3b81f2347467a4b98b22ab80)

## [1.0.0-beta.4](https://github.com/attojs/vue-request/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2020-12-07)
