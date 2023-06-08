English | [简体中文](README.md)

<p align="center">
  <a href="https://www.attojs.org">
    <img
      width="150"
      src="https://raw.githubusercontent.com/AttoJS/art/master/vue-request-logo.png"
      alt="VueRequest logo"
    />
  </a>
</p>
<h1 align="center">VueRequest</h1>
<div align="center">
  <p align="center">⚡️ This is a library that can easily help you manage request states, supporting common features such as SWR, polling, error retry, caching, and pagination, etc.</p>
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

## Why VueRequest

In past projects, we were often troubled by the repetitive implementation of loading state management, request throttling and debouncing, API data caching, pagination, etc. Every time we started a new project, we had to handle these issues manually, which was a repetitive task that also required ensuring team consistency.

VueRequest is designed to provide developers with a convenient and fast way to manage API states. By simply configuring it, you can eliminate the tedious tasks and focus on core development.

## Features

- 🌈 &nbsp;Support Vue 2 & 3
- 🚀 &nbsp;All data is reactive
- 🔄 &nbsp;Interval polling
- 🤖 &nbsp;Automatic error retry
- 🗄 &nbsp;Built-in cache
- 💧 &nbsp;Throttle and Debounce
- ⚙️ &nbsp;Powerful pagination extension and load more extensions
- 📠 &nbsp;Written in TypeScript
- ⚡️ &nbsp;Compatible with Vite
- 🍃 &nbsp;Lightweight
- 📦 &nbsp;Out of the box

## Documentation

- [English](https://www.attojs.org/)
- [中文文档](https://www.attojs.com/)

## Install

You can install VueRequest with [NPM](https://www.npmjs.com/), [YARN](https://yarnpkg.com/), or a `<script>` via [unpkg.com](https://unpkg.com/)

### NPM

```sh
npm install vue-request
# or
yarn add vue-request
# or
pnpm install vue-request
```

### CDN

> For production environments, we recommend linking to a specific version and build file to avoid unexpected breaking changes caused by new versions.

```html
<script src="https://unpkg.com/vue-request/dist/vue-request.min.js"></script>
```

Once you add it to your page, you can access our exported methods in `window.VueRequest`.

## Usage

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

In this example, `useRequest` receives a `service` function. `service` is an asynchronous request function, which means you can use **axios** to retrieve data and return a **Promise**. More specific details can be found in the [documentation](https://www.attojs.org/guide/documentation/dataFetching.html).

The `useRequest` function also returns three values: `data`, `loading`, and `error`. While the request is still in progress, `data` will be set to `undefined` and `loading` will be `true`. Once the request is completed, `data` and `error` will be set based on the result, and the page will be rendered accordingly. This is because `data`, `loading`, and `error` are [Reactivity(Refs)](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) in Vue, and their values will be updated based on the request status and result.

## Some of the coolest features:

VueRequest provides many features, such as error retry, caching, pagination, throttling, debouncing, and more. Here are two particularly cool features:

### 1.Refresh On Focus

Sometimes, you need to ensure data consistency across multiple browser windows or synchronize page data to the latest state when a user's computer resumes from sleep mode. Using `refreshOnWindowFocus` can save you a lot of logic code. [Click here to go to the document](https://www.attojs.org/guide/documentation/refreshOnWindowFocus.html)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  refreshOnWindowFocus: true,
  refocusTimespan: 1000, // refresh interval 1s
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAs8s.gif)

### 2.Polling Data

Sometimes, you need to ensure data synchronization across multiple devices. In this case, you can use `pollingInterval` provided by us to periodically re-request the API, ensuring data consistency across multiple devices. When a user modifies the data, the changes will be synced in real-time between two windows. [Click here to go to the document](https://www.attojs.org/guide/documentation/polling.html)

```ts
const { data, error, run } = useRequest(getUserInfo, {
  pollingInterval: 1000, // polling interval 1s
});
```

![vue-request](https://z3.ax1x.com/2021/09/10/hXAy2n.gif)

## Thanks

Thank them for inspiring us.

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
