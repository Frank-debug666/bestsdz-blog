# 小川札记

一个基于 Astro、Markdown 和 Content Collections 的个人静态博客。

## 本地运行

```bash
npm install
npm run dev
```

## 写文章

在 `src/content/posts` 新建 Markdown 文件：

```md
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-06-16
tags: [技术, 笔记]
---

正文内容。
```

## 构建

```bash
npm run build
```

## 部署

推荐部署到 Vercel 或 Cloudflare Pages。构建命令使用 `npm run build`，输出目录是 `dist`。

上线前把 `astro.config.mjs` 里的 `site` 改成你的真实域名，这会影响 RSS 链接。
