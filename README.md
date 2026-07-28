# 去你想去的地方

“会飞的蒲公英”的个人博客与 AI 系列课程站。项目基于 Astro、Markdown
Content Collections 和 Cloudflare Pages，正式域名为
<https://bestsdz.xyz/>。

## 当前内容

- 67 篇公开文章
- 59 个配套视频
- AI 新手路线、完整课程路线、视频中心和术语词典
- Giscus 评论、Cloudflare Web Analytics、RSS、Sitemap 和站内搜索

课程长期规划见 `AI-course-publishing-roadmap.md`。

## 本地运行

```bash
npm ci
npm run dev
```

需要 Node.js 22.12 或更高版本。

## 写文章

在 `src/content/posts` 新建 Markdown 文件：

```md
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-06-16
tags: [技术, 笔记]
cover: /images/covers/example.jpg
coverAlt: 封面图说明
---

正文内容。
```

文章中的配套视频、字幕和封面分别放在：

```text
public/videos/
public/images/covers/
```

## 检查与构建

```bash
npm run build
```

该命令会先执行 `astro check`，再输出静态站点到 `dist`。

## 部署

正式站使用 Cloudflare Pages：

```bash
npx wrangler pages deploy dist --project-name bestsdz-blog --branch main
```

`wrangler.toml` 负责 Pages 输出目录和文章浏览量 KV 绑定。

仓库同时保留 GitHub Pages 工作流作为静态备份。推送 `main` 后，
`.github/workflows/deploy.yml` 会自动构建；GitHub Pages 不支持
Cloudflare Pages Functions，因此浏览量接口只在正式站完整可用。

## 配置入口

- `src/site.config.ts`：站点名称、作者、评论和统计配置
- `astro.config.mjs`：正式域名
- `wrangler.toml`：Cloudflare Pages 与 KV
- `BLOG_FEATURE_SETUP.md`：第三方服务配置说明
- `BLOG_OPERATION_AND_QA.md`：维护、发布和验收记录
