# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
