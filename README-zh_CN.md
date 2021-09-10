[English](./README.md) | 简体中文

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
  <p align="center">⚡️ 一个能轻松帮你管理请求状态（支持SWR，轮询，错误重试，缓存，分页等）的 Vue 3 composition API 请求库</p>
  <a href="https://codecov.io/github/attojs/vue-request?branch=master">
    <img
      src="https://img.shields.io/codecov/c/github/attojs/vue-request?token=NW2XVQWGPP"
      alt="Coverage Status"
    />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/bundlephobia/minzip/vue-request/latest" alt="Size" />
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

在以往的业务项目中，常常被 loading 状态的管理、请求的节流防抖、接口数据的缓存、分页等这些重复的实现所困惑。每当开启一个新项目时，我们都得手动去处理以上这些问题，这将是一个重复性的工作，而且还得确保团队的一致。

VueRequest 旨在为开发者提供便捷、快速的方式来管理接口的状态。在业务开发中省去上述的那些“脏活累活”，只需要简单的配置即可使用，专注于业务核心的开发。

## 特性

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

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  setup() {
    const { data, loading, error } = useRequest(service);

    return {
      data,
      loading,
      error,
    };
  },
});
</script>
```

在这个例子中，`useRequest` 接收了一个 `service` 函数。`service`是一个异步的请求函数，换句话说，你可以使用 **axios** 来获取数据，然后返回一个 **Promise**。更具体的说明可以在[文档](https://www.attojs.com/guide/documentation/dataFetching.html)中查看。

`useRequest` 还返回了三个值， `data`、`loading` 和 `error`。当请求还没完成时, `data` 将会为 `undefined` 同时，`loading` 将被设置为 `true`。当请求完成后，则将会根据请求结果来设定 `data` 和 `error`，并对页面进行渲染。这是因为 `data`、 `loading` 和 `error` 是 Vue 的 [响应式引用(Refs)](https://v3.cn.vuejs.org/guide/reactivity-fundamentals.html)，它们的值将根据请求状态及请求结果来修改。

## 一些很酷的特性

VueRequest 有非常多的特性，如 错误重试、缓存、分页、节流、防抖...，这里列举两个个比较酷的特性

### 1.聚焦页面时自动重新请求

有些时候，你要确保多个浏览器窗口之间数据的一致性；又或者是当用户电脑在休眠状态重新激活后，页面的数据需要同步到最新状态时。`refreshOnWindowFocus` 可能会为你节省很多逻辑代码。[点击这里直达文档](https://www.attojs.com/guide/documentation/refreshOnWindowFocus.html)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  refreshOnWindowFocus: true,
  refocusTimespan: 1000, // 请求间隔时间
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAs8s.gif)

### 2.轮询数据

有些时候，你要确保多个设备间数据的同步更新。这时候可以用我们提供的 `pollingInterval` 来定期重新请求接口，这样就可以保证多设备间的数据一致性。当用户进行修改数据时，两个窗口将会实时同步更新。[点击这里直达文档](https://www.attojs.com/guide/documentation/polling.htm)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  pollingInterval: 1000, // 请求间隔时间
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAy2n.gif)

## TODO 列表

如果你有很酷的想法，欢迎提交 issue 以便我们讨论

- [ ] 支持 Vue 2
- [x] 文档
- [x] 分页
- [x] 加载更多

## 致谢

感谢他们为我们提供了灵感

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
