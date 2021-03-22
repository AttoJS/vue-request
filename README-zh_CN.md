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
</div>

## 特性

- 🚀 所有数据都具有响应式
- 🔄 轮询请求
- 🤖 自动处理错误重试
- 🗄 内置请求缓存
- 📠 完全使用 Typescript 编写，具有强大的类型提示
- 🍃 轻量化
- 📦 开箱即用
- 🔥 有趣的可交互文档

## 文档

- [English](https://www.attojs.org/)
- [中文](https://www.attojs.org/zh/)
- [国内镜像](https://www.attojs.com/zh/)

## 安装

```bash
npm install vue-request

# or with yarn
yarn add vue-request
```

### CDN

```html
<script src="https://unpkg.com/vue-request"></script>
```

它将以 `window.VueRequest.useRequest` 暴露在全局

## 用例

```tsx
import { useRequest } from 'vue-request';

export default {
  setup() {
    const { data } = useRequest('api/user');
    return () => <div>{data.value}</div>;
  },
};
```

## TODO 列表

如果你有很酷的想法，欢迎提交 issue 以便我们讨论

- [x] 文档
- [x] 分页
- [x] 加载更多

## 致谢

感谢他们为我们提供了灵感

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
