# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.4](https://github.com/attojs/vue-request/compare/v2.0.3...v2.0.4) (2023-10-16)

### Refactor

- `useRequest` 支持传入自定义插件 [#204](https://github.com/attojs/vue-request/issues/204) ([3280f44](https://github.com/attojs/vue-request/commit/3280f4402728252e0154e22140c5a3913d407823))
- 导出部分缺失的类型 [#215](https://github.com/attojs/vue-request/issues/215) [#217](https://github.com/attojs/vue-request/issues/217) ([35b07a4](https://github.com/attojs/vue-request/commit/35b07a4ffa22aca2cac3d1c46a0f4b99e4d1f206))

### [2.0.3](https://github.com/attojs/vue-request/compare/v2.0.2...v2.0.3) (2023-06-13)

### Refactor

- expose `definePlugin` ([2a03d38](https://github.com/attojs/vue-request/commit/2a03d38b279c0a9e2753248a3ab657c82bf19144))

### [2.0.2](https://github.com/attojs/vue-request/compare/v2.0.1...v2.0.2) (2023-06-02)

### Refactor

- Convert optional chaining syntax [#199](https://github.com/attojs/vue-request/issues/199) ([f1c79fb](https://github.com/AttoJS/vue-request/commit/f1c79fbafa103c3fe0048b4756123d431bb92809))

### [2.0.1](https://github.com/attojs/vue-request/compare/v1.2.4...v2.0.1) (2023-06-01)

## Changelog

- Use `vue-demi` to be compatible with Vue 2 #38
- Added custom cache `getCache`, `setCache`, and `clearCache`.
- When caching is enabled, requests with the same `cacheKey` will be cached and reused.
- Added `runAsync` and `refreshAsync`, which return a `Promise`.
- Added `definePlugin` to extend the functionality of useRequest through plugins.
- In throttle/debounce mode, `runAsync` can be used to return a normal `Promise`.
- Added `useRequestProvider` hooks to inject options configuration.
- Added `refreshDepsAction` option to customize the behavior after `refreshDeps` is triggered.
- `refreshDepsAction` will also be triggered by changes in `refreshDeps` when `manual=true`.
- Added `loadingKeep`.
- **Removed the integrated request library and `service` no longer supports strings or objects.** [Migration Guide](#1)
- **Removed `formatResult`.** [Migration Guide](#2)
- **Removed `queryKey`, i.e., parallel mode is removed** [Migration Guide](#3)
- **`run` no longer returns a `Promise`** [Migration Guide](#5)
- **When a request fails, `data` is no longer cleared** #82
- **Modified the logic of `ready`** [Migration Guide](#4)
- **`ready` now supports passing a function that returns a Boolean value** #166
- **`data` and `error` changed to `shallowRef`**
- **`usePagination` removed `reload` method and `reloading`. If needed, they can be implemented separately.**
- **Removed `RequestConfig` component** [Migration Guide](#6)
- **Refactored `useLoadMore`, see details for specific API** [API Description](#useloadmore-api)
- **`cacheKey` can now be passed a function: `cacheKey: (params?: P) => string`**
  ```ts
  useRequest(getUser, {
    cacheKey: (params?: P): string => {
      // When initialized, `params` will be undefined, so we need to manually check and return an empty string
      if (params) {
        return `user-key-${params[0].name}`;
      }
      return '';
    },
  });
  ```
- Some `options` support reactivity, as shown below:

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

- **`refreshDeps` now supports passing a function that returns a value, a ref, a reactive object, or an array of any of these types.** #166

## Migration Guide

1. `service` no longer supports strings or objects. Users are expected to wrap their requests using other third-party libraries (such as `axios`) and provide a `Promise` as the `service` function. <a name="1"></a>

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

2. `formatResult` has been removed. Users are expected to format the final data in their `service` function. <a name="2"></a>

   ```js
   const getUser = async () => {
     const results = await axios.get('api/user');
     // Format the final data here
     return results.data;
   };
   ```

3. `queryKey` has been removed, which means parallel mode is no longer supported. Users are expected to encapsulate each request action and UI into a component instead of putting all requests in the parent component. <a name="3"></a>

4. Changes to the `ready` logic <a name="4"></a>

   - When `manual=false`, every time `ready` changes from `false` to `true`, a request will be automatically triggered with the `options.defaultParams` parameter.
   - When `manual=true`, a request cannot be made as long as `ready` is `false`.

5. `run` no longer returns a `Promise`. Use `runAsync` instead of the original `run` function. <a name="5"></a>

6. Users can wrap `useRequest` with `useRequestProvider` themselves. <a name="6"></a>

## useLoadMore API

### Options

| Name | Description | Type |
| --- | --- | --- |
| manual | When set to `true`, you need to manually trigger `loadMore` or `loadMoreAsync` to make a request. The default value is `false`. | `boolean` |
| ready | When `manual=false`, every time `ready` changes from `false` to `true`, `refresh` will be automatically triggered. When `manual=true`, a request cannot be made as long as `ready` is `false`. | `Ref<boolean> \| () => boolean` |
| refreshDeps | Automatically trigger `refresh` when changed. If `refreshDepsAction` is set, `refreshDepsAction` will be triggered. | `WatchSource<any> \| WatchSource<any>[]` |
| refreshDepsAction | Triggered when `refreshDeps` changes. | `() => void` |
| debounceInterval | Process the request with a debounce strategy. | `number \| Ref<number>` |
| debounceOptions | Debounce parameters. | `{leading: false, maxWait: undefined, trailing: true}` |
| throttleInterval | Process the request with a throttle strategy. | `number \| Ref<number>` |
| throttleOptions | Throttle parameters. | `{leading: false, trailing: true}` |
| errorRetryCount | The number of error retries when an error occurs. | `number \| Ref<number>` |
| errorRetryInterval | The interval between error retries when an error occurs. | `number \| Ref<number>` |
| isNoMore | Determines whether there is more data. | `(data?: R) => boolean` |
| onBefore | Triggered before `service` is executed. | `() => void` |
| onAfter | Triggered when `service` is completed. | `() => void` |
| onSuccess | Triggered when `service` is resolved. | `(data: R) => void` |
| onError | Triggered when `service` is rejected. | `(error: Error) => void` |

### Result

| Name | Description | Type |
| --- | --- | --- |
| data | The data returned by `service`, which must include an array `list`, of type `{ list: any[], ...other }`. | `Ref<R>` |
| dataList | The `list` array of `data`. | `Ref<R['list']>` |
| loading | Whether a request is in progress. | `Ref<boolean>` |
| loadingMore | Whether more data is being loaded. | `Ref<boolean>` |
| noMore | Whether there is more data, which needs to be used with `options.isNoMore`. | `Ref<boolean>` |
| error | The error returned by `service`. | `Error` |
| loadMore | Load more data, automatically capture exceptions, and handle them through `options.onError`. | `() => void` |
| loadMoreAsync | Load more data, return `Promise`, and handle errors on your own. | `() => Promise<R>` |
| refresh | Refresh and load the first page of data, automatically capture exceptions, and handle them through `options.onError`. | `() => void` |
| refreshAsync | Refresh and load the first page of data, return `Promise`, and handle errors on your own. | `() => Promise<R>` |
| mutate | Directly modify the result of `data`. | `(arg: (oldData: R) => R) => void \| (newData: R) => void` |
| cancel | Cancel the request. | `() => void` |

### [1.2.4](https://github.com/attojs/vue-request/compare/v1.2.3...v1.2.4) (2022-01-21)

### Refactor

- replacing IIFE with UMD modules ([2f05be8](https://github.com/AttoJS/vue-request/commit/2f05be83238416437c87a5b5bdaea4a87f982e88))

### [1.2.3](https://github.com/attojs/vue-request/compare/v1.2.2...v1.2.3) (2021-10-12)

### Bug Fixes

- Fix incorrect import path [#71](https://github.com/attojs/vue-request/issues/71) ([#72](https://github.com/attojs/vue-request/issues/72)) ([2926510](https://github.com/attojs/vue-request/commit/2926510db896205bdaf597bb5b28d8c9efcbffdd))

### [1.2.2](https://github.com/attojs/vue-request/compare/v1.2.1...v1.2.2) (2021-10-06)

### Bug Fixes

- Fix nullish operator is not transform

### [1.2.1](https://github.com/attojs/vue-request/compare/v1.2.0...v1.2.1) (2021-10-06)

### Features

- **core:** add throttle and debounce options [#63](https://github.com/attojs/vue-request/issues/63) ([decbbd3](https://github.com/attojs/vue-request/commit/decbbd3a2da5e559556126c6ed1166415ce87c06))

## [1.2.0](https://github.com/attojs/vue-request/compare/v1.1.1...v1.2.0) (2021-05-22)

### Features

- **usePagination:** add `changePagination()` to modify both `current` and `pageSize` [#43](https://github.com/attojs/vue-request/issues/43) ([c3822f0](https://github.com/attojs/vue-request/commit/c3822f0fe0d579dc1b534c6e9c6845dc6ca3f0f1))
- add `onBefore()` and `onAfter()` hooks [#42](https://github.com/attojs/vue-request/issues/42) ([135e76f](https://github.com/attojs/vue-request/commit/135e76f06ee9605e5a0a64f6def363df36bf7947))
- add `reloading` to record the loading status of `reload()` [#41](https://github.com/attojs/vue-request/issues/41) ([5034f2c](https://github.com/attojs/vue-request/commit/5034f2c7110e16d63b824793dc57ebea27e15ae8))

### Performance Improvements

- optimization package size, volume reduction **88%** [#44](https://github.com/attojs/vue-request/issues/44) ([6a5b074](https://github.com/attojs/vue-request/commit/6a5b074de77bd3dbbf1150e8db202ee5fc1c59dc), [ffbc5d1](https://github.com/attojs/vue-request/commit/ffbc5d1e49f99ffa52106085f90117095fa884b6), [ce233ca](https://github.com/attojs/vue-request/commit/ce233ca74c81507ed3177576674d495054d155b7), [#45](https://github.com/attojs/vue-request/issues/45)([4272062](https://github.com/attojs/vue-request/commit/4272062f2a160f4ca3dd01bdee42bef263a132c7)))

### ⚠ BREAKING CHANGES

- not support IE11 [#44](https://github.com/attojs/vue-request/issues/44) ([686e4cd](https://github.com/attojs/vue-request/commit/686e4cdcf802a08af9590088dceaebd2d9249671))

## [1.1.1](https://github.com/attojs/vue-request/compare/v1.1.0...v1.1.1) (2021-04-28)

### Bug Fixes

- **usePagination:** `defaultParams.current` and `defaultParams.pageSize` should work if `manual: true` ([3ca5fd7](https://github.com/attojs/vue-request/commit/3ca5fd7749a2aafb723797e299df5c6a8bd0e37f)), closes [#40](https://github.com/attojs/vue-request/issues/40)

## [1.1.0](https://github.com/attojs/vue-request/compare/v1.0.5...v1.1.0) (2021-04-19)

### Features

- **useLoadMore:** refactor `refresh` and `cancel` of `useLoadMore`, add `refreshing` [#36](https://github.com/attojs/vue-request/issues/36) ([7c34351](https://github.com/attojs/vue-request/commit/7c34351fbc8dad763effb33f4bd7b9e4cb18b9d6))

### Bug Fixes

- root level `refresh`, `mutate`, `cancel` not work with `queryKey` [#37](https://github.com/attojs/vue-request/issues/37) ([66b3198](https://github.com/attojs/vue-request/commit/66b31981353fee5c9ebda806bbbeccef4bf6e4c3))

### ⚠ BREAKING CHANGES

- **useLoadMore:** remove `mutate` of `useLoadMore` ([b935bcd](https://github.com/attojs/vue-request/commit/b935bcd01629b38ba068e82ca062380b6434c85f))

## [1.0.5](https://github.com/attojs/vue-request/compare/v1.0.4...v1.0.5) (2021-03-22)

### Bug Fixes

- `onSuccess` type is incorrect ([407ed11](https://github.com/attojs/vue-request/commit/407ed116ebed813e1f07cede97ad2285281e76ba)), closes [#31](https://github.com/attojs/vue-request/issues/31)
- invalid import path ([0a31504](https://github.com/attojs/vue-request/commit/0a315040a1e38cbb9b8cb877b912fbde091f471c)), closes [#33](https://github.com/attojs/vue-request/issues/33)

## [1.0.4](https://github.com/attojs/vue-request/compare/v1.0.3...v1.0.4) (2021-03-08)

### Bug Fixes

- fix `useLoadMore` types ([0e673bf](https://github.com/attojs/vue-request/commit/0e673bffb683164bfad6c58b4aa58c7d7734428e))

## [1.0.3](https://github.com/attojs/vue-request/compare/v1.0.0-beta.11...v1.0.3) (2021-03-06)

### Bug Fixes

- concurrent request should have independent events ([7511720](https://github.com/attojs/vue-request/commit/7511720223ed9e620339e4d61be46426464feb10))

### Features

- `usePagination` and `useLoadMore` support global config ([8cceb1e](https://github.com/attojs/vue-request/commit/8cceb1e44aae6943d9303ecc38a4d7f2e582498e))
- **usePagination:** add `reload` function to reset paging info ([def45e3](https://github.com/attojs/vue-request/commit/def45e37998e2951cfa78600a58595c2f85969d4))
- **useRequest:** add `reload` function to clear the `queries` list ([b64216b](https://github.com/attojs/vue-request/commit/b64216bc264e775f214c1c574ffb8df948521c53))

## [1.0.0-beta.11](https://github.com/attojs/vue-request/compare/v1.0.0-beta.10...v1.0.0-beta.11) (2021-03-03)

### Features

- add useLoadMore ([#28](https://github.com/attojs/vue-request/issues/28)) ([6f986b2](https://github.com/AttoJS/vue-request/commit/6f986b273d1380dd26ddac19926dbabbdbef3760))

## [1.0.0-beta.10](https://github.com/attojs/vue-request/compare/v1.0.0-beta.9...v1.0.0-beta.10) (2021-03-02)

### ⚠ BREAKING CHANGES

- `queries` changed from `shallowReactive` to `reactive` ([8f940a4](https://github.com/attojs/vue-request/commit/8f940a4e8eece210d382c8fed00303b2ebe9d26f))

## [1.0.0-beta.9](https://github.com/attojs/vue-request/compare/v1.0.0-beta.8...v1.0.0-beta.9) (2021-02-26)

### ⚠ BREAKING CHANGES

- **usePagination:** does not support concurrent request ([2c083ef](https://github.com/attojs/vue-request/commit/2c083ef1ab5319947a7db6d86110f65da569085e))

### Refactor

- **usePagination:** `current` and `pageSize` can modify and can trigger request, means you can directly use `v-model` to bind them ([ea5a238](https://github.com/attojs/vue-request/commit/ea5a23876322e744c0998ae5bfd787e93bd66e1f))

## [1.0.0-beta.8](https://github.com/attojs/vue-request/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2021-02-24)

### Features

- add usePagination ([#26](https://github.com/attojs/vue-request/issues/26)) ([bc21ed2](https://github.com/attojs/vue-request/commit/bc21ed2f42ce2307a69a758de9b741fb18dd0a6c))

## [1.0.0-beta.7](https://github.com/AttoJS/vue-request/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2021-01-11)

### Feature

- add back off algorithm to errorRetryInterval （[#19](https://github.com/AttoJS/vue-request/pull/19)) [13ce153](https://github.com/AttoJS/vue-request/commit/13ce153f5eaafab8d9ffdfac5ec771f35142df23)

## [1.0.0-beta.6](https://github.com/attojs/vue-request/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2020-12-31)

### Refactor

- add `isServer` to be compatible with node env [4f1c797](https://github.com/AttoJS/vue-request/commit/4f1c7971bed7eb45c68a1d9ae89a2134a29cd7aa)
- modify the default value of `cacheTime` to 10 minutes [a56ecb0](https://github.com/AttoJS/vue-request/commit/a56ecb012dea93996bf61a2bc4228cd7a7f98a42)

## [1.0.0-beta.5](https://github.com/attojs/vue-request/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2020-12-14)

### Bug Fixes

- babel supports .tsx extension ([#15](https://github.com/AttoJS/vue-request/issues/15)) [c7d8c3d](https://github.com/AttoJS/vue-request/commit/c7d8c3de463dc50c3b81f2347467a4b98b22ab80)

## [1.0.0-beta.4](https://github.com/attojs/vue-request/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2020-12-07)
