# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
