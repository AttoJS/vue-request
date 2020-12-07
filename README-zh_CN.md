[English](./README.md) | 简体中文

<p align="center">
  <img
    width="150"
    src="https://raw.githubusercontent.com/AttoJS/art/master/vue-request-logo.png"
    alt="VueRequest logo"
  />
</p>
<h1 align="center">VueRequest</h1>
<div align="center">
  <p align="center">⚡️ 一个很酷的 Vue3 的请求库</p>
  <a href="https://codecov.io/github/attojs/vue-request?branch=master">
    <img
      src="https://img.shields.io/codecov/c/github/attojs/vue-request?token=NW2XVQWGPP"
      alt="Coverage Status"
    />
  </a>
  <a href="https://npmcharts.com/compare/vue-request?minimal=true">
    <img src="https://img.shields.io/bundlephobia/min/vue-request.svg" alt="Size" />
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
</div>

# 当前状态: Beta

## 特性

- 🚀 所有数据都具有响应式
- 🔄 轮询请求
- 🤖 自动处理错误重试
- 🗄 内置请求缓存
- 📠 完全使用 Typescript 编写，具有强大的类型提示
- 🍃 轻量化
- 📦 开箱即用
- 🔥 有趣的可交互文档

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

它将以 `window.VueRequest.useRequest` 的形式在暴露在全局

## 使用

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

- [ ] 文档
- [ ] 分页扩展
- [ ] "Load More" 扩展
- [ ] 支持 Vue 2

## 致谢

感谢他们为我们提供了灵感

- [vercel/swr](https://github.com/vercel/swr)
- [alibaba/hooks](https://ahooks.js.org/hooks/async#userequest)

感谢 [xiadd](https://github.com/xiadd) 为我们提供了 [vue-request](https://www.npmjs.com/package/vue-request) 这个很酷的 NPM 包名！

## License

[MIT License](https://github.com/AttoJS/vue-request/blob/master/LICENSE) © 2020-present [AttoJS](https://github.com/AttoJS)
