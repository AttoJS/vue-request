English | [简体中文](README-zh_CN.md)

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
  <p align="center">⚡️ Vue 3 composition API for data fetching, supports SWR, polling, error retry, cache request, pagination, etc.</p>
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

## Features

- 🚀 All data is reactive
- 🔄 Interval polling
- 🤖 Automatic error retry
- 🗄 Built-in cache
- 📠 Written in TypeScript
- 🍃 Lightweight
- 📦 Out of the box
- 🔥 Interactive docs

## Documentation

- [English](https://www.attojs.org/)
- [中文](https://cn.attojs.org/)
- [国内镜像](https://www.attojs.com/)

## Install

```bash
npm install vue-request

# or with yarn
yarn add vue-request
```

### CDN

```html
<script src="https://unpkg.com/vue-request"></script>
```

It will be exposed to global as `window.VueRequest.useRequest`

## Usage

```tsx
import { useRequest } from 'vue-request';

export default {
  setup() {
    const { data } = useRequest('api/user');
    return () => <div>{data.value}</div>;
  },
};
```

## TODO List

If you have any cool features, please submit an issue for discussion

- [x] Documentation
- [x] Pagination
- [x] Load More

## Thanks

Thank them for inspiring us.

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
