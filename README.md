[English](./README-en_US.md) | 简体中文

<p align="center">
  <a href="https://www.attojs.com">
    <img
      width="150"
      src="https://raw.githubusercontent.com/AttoJS/art/master/vue-request-logo.png"
      alt="VueRequest logo"
    />
  </a>
</p>
<h1 align="center">VueRequest</h1>
<div align="center">
  <p align="center">⚡️ 这是一个能够轻松帮助你管理请求状态的库，支持 SWR、轮询、错误重试、缓存、分页等常用功能。</p>
  <a href="https://codecov.io/github/attojs/vue-request?branch=master">
    <img
      src="https://img.shields.io/codecov/c/github/attojs/vue-request?token=NW2XVQWGPP"
      alt="Coverage Status"
    />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/bundlephobia/minzip/vue-request" alt="Size" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/npm/v/vue-request" alt="Version" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/github/languages/top/attojs/vue-request" alt="Languages" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/npm/l/vue-request" alt="License" />
  </a>
  <a href="https://github.com/AttoJS/vue-request/stargazers">
    <img src="https://img.shields.io/github/stars/attojs/vue-request" alt="Star" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/npm/dm/vue-request" alt="Download" />
  </a>
</div>

## 为什么选择 VueRequest

在以往的业务项目中，我们经常会被 loading 状态的管理、请求的节流防抖、接口数据的缓存、分页等重复的功能实现所困扰。每次开启一个新项目都需要重新实现一遍，这是一项重复的工作，还需要确保团队的一致性。

VueRequest 的目的是为开发人员提供一种方便、快速的方式来管理 API 状态。通过简单的配置，可以省去那些繁琐的任务，专注于业务核心的开发。

## 特性

- 🌈 &nbsp;兼容 Vue 2 & 3
- 🚀 &nbsp;所有数据都具有响应式
- 🔄 &nbsp;轮询请求
- 🤖 &nbsp;自动处理错误重试
- 🗄 &nbsp;内置请求缓存
- 💧 &nbsp;节流请求与防抖请求
- 🎯 &nbsp;聚焦页面时自动重新请求
- ⚙️ &nbsp;强大的分页扩展以及加载更多扩展
- 📠 &nbsp;完全使用 Typescript 编写，具有强大的类型提示
- ⚡️ &nbsp;兼容 Vite
- 🍃 &nbsp;轻量化
- 📦 &nbsp;开箱即用

## 文档

- [English](https://www.attojs.org/)
- [中文文档](https://www.attojs.com/)

## 安装

你可以通过 [NPM](https://www.npmjs.com/)、[YARN](https://yarnpkg.com/) 或者通过 `<script>` 的方式引入 [unpkg.com](https://unpkg.com/) 上的包。

### NPM

```sh
npm install vue-request
# or
yarn add vue-request
# or
pnpm install vue-request
```

### CDN

> 对于生产环境，我们推荐链接到一个明确的版本号和构建文件，以避免新版本造成的不可预期的破坏。

```html
<script src="https://unpkg.com/vue-request/dist/vue-request.min.js"></script>
```

一旦你在页面中添加了它，你就可以在 `window.VueRequest` 中访问我们导出的方法。

## 示例

```vue
<template>
  <div>
    <div v-if="loading">loading...</div>
    <div v-if="error">failed to fetch</div>
    <div v-if="data">Hey! {{ data }}</div>
  </div>
</template>

<script lang="ts" setup>
const { data, loading, error } = useRequest(service);
</script>
```

在这个例子中，`useRequest` 接收了一个 `service` 函数。`service`是一个异步的请求函数，换句话说，你可以使用 **axios** 来获取数据，然后返回一个 **Promise**。更具体的说明可以在[文档](https://www.attojs.com/guide/documentation/dataFetching.html)中查看。

`useRequest` 函数还会返回三个值：`data`、`loading` 和 `error`。当请求还未完成时，`data` 的值为 `undefined`，同时 `loading` 的值会被设置为 `true`。当请求完成后，`data` 和 `error` 的值将根据请求结果进行设置，并且页面也会相应地进行渲染。这是因为 `data`、`loading` 和 `error` 是 Vue 中的[响应式引用(Refs)](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)，它们的值会根据请求状态和结果进行修改。

## 一些很酷的特性

VueRequest 提供了很多特性，如：错误重试、缓存、分页、节流、防抖等等。这里列举两个比较酷的特性：

### 1.聚焦页面时自动重新请求

有时，你需要确保多个浏览器窗口之间的数据保持一致性；或者在用户电脑从休眠状态中恢复并重新激活时，需要将页面的数据同步到最新状态。使用 `refreshOnWindowFocus` 可以帮助你节省很多逻辑代码。[点击这里直达文档](https://www.attojs.com/guide/documentation/refreshOnWindowFocus.html)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  refreshOnWindowFocus: true,
  refocusTimespan: 1000, // 请求间隔时间
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAs8s.gif)

### 2.轮询数据

有时候，你需要确保多个设备之间的数据同步更新。这时候可以使用我们提供的 `pollingInterval` 定期重新请求接口，以确保多个设备之间的数据一致性。当用户修改数据时，两个窗口将会实时同步更新。[点击这里直达文档](https://www.attojs.com/guide/documentation/polling.html)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  pollingInterval: 1000, // 请求间隔时间
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAy2n.gif)

## 致谢

感谢他们为我们提供了灵感

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
