English | [简体中文](README-zh_CN.md)

<p align="center">
  <img
    width="150"
    src="https://raw.githubusercontent.com/AttoJS/art/master/vue-request-logo.png"
    alt="VueRequest logo"
  />
</p>
<h1 align="center">VueRequest</h1>
<div align="center">
  <p align="center">⚡️ A request library for Vue 3.</p>
  <a href="https://codecov.io/github/attojs/vue-request?branch=master">
    <img
      src="https://img.shields.io/codecov/c/github/attojs/vue-request?token=NW2XVQWGPP"
      alt="Coverage Status"
    />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/bundlephobia/min/vue-request" alt="Size" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/npm/v/vue-request/beta" alt="Version" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/github/languages/top/attojs/vue-request" alt="Languages" />
  </a>
  <a href="https://www.npmjs.com/package/vue-request">
    <img src="https://img.shields.io/npm/l/vue-request" alt="License" />
  </a>
</div>

# Status: Beta

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

- [English](https://attojs.github.io/vue-request-docs/) WIP
- [中文](https://attojs.gitee.io/vue-request-docs/zh/)

## Install

```bash
npm install vue-request@beta

# or with yarn
yarn add vue-request@beta
```

### CDN

```html
<script src="https://unpkg.com/vue-request@beta"></script>
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

- [ ] Documentation
- [ ] Pagination
- [ ] Load More
- [ ] Support Vue 2

## Thanks

Thank them for inspiring us.

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

Thanks to [xiadd](https://github.com/xiadd) for providing the awesome [vue-request](https://www.npmjs.com/package/vue-request) npm package name!

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
