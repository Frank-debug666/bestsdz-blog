# 去你想去的地方：博客说明与验收文档

最后更新：2026-06-18

站点地址：https://bestsdz.xyz/

GitHub 仓库：https://github.com/Frank-debug666/bestsdz-blog

Cloudflare Pages 项目：`bestsdz-blog`

## 当前已完成的功能

### 内容与页面

- 主页：港湾背景图、站点标题、最新文章入口、AI 路线入口。
- 文章列表页：全部文章归档、文章卡片、前端搜索。
- 文章详情页：封面图、标题、发布日期、阅读时间、目录、正文、上一篇/下一篇、作者卡片、评论区预留。
- AI 入门路线合集页：已发布文章学习路线 + 后续发布日历。
- 关于页：说明作者“史迪仔”和博客定位。
- 404 页面：自定义错误页，提供返回文章和 AI 路线入口。

### 订阅与 SEO

- `/rss.xml`：RSS 订阅源。
- `/sitemap.xml`：站点地图。
- `/robots.txt`：允许搜索引擎抓取，并声明 sitemap。
- `/search.json`：文章搜索索引。
- 文章页 JSON-LD：使用 `BlogPosting` 结构化数据。
- 基础 meta：title、description、canonical、Open Graph、Twitter card、author、manifest。
- `/site.webmanifest`：移动端收藏/安装时显示站点名称和图标。

### 交互与增强

- 文章列表搜索：输入关键词后实时过滤文章。
- 代码块复制按钮：文章里出现 fenced code block 时自动显示“复制”按钮。
- 作者卡片：文章底部展示“我是史迪仔”、头像、简介和相关入口。
- 评论区预留：Giscus 参数配置后自动启用正式评论。
- Cloudflare Web Analytics 预留：填入 token 后自动启用访问统计。
- 可访问性基础：键盘 focus 样式、跳到正文链接、移动端横向溢出修复。

## 文章发布方式

文章文件放在：

```text
src/content/posts/
```

新文章建议复制一篇现有 Markdown 文章作为模板，例如：

```text
src/content/posts/what-is-neural-network.md
```

文章 frontmatter 示例：

```md
---
title: "文章标题"
description: "一句话摘要，用于列表、SEO 和 RSS。"
pubDate: 2026-06-18
tags: ["AI基础", "PyTorch"]
cover: "/images/covers/example.png"
coverAlt: "封面图说明"
---

正文从这里开始。
```

发布后需要执行：

```powershell
npm run build
```

如果构建通过，再部署：

```powershell
npx --yes wrangler@latest pages deploy dist --project-name bestsdz-blog --branch main
```

最后提交 GitHub：

```powershell
git add .
git commit -m "Publish new post"
git push
```

## 常用修改位置

### 改站点名称、作者、简介

文件：

```text
src/site.config.ts
```

这里集中管理：

- 站点名
- 站点 URL
- 站点描述
- 作者名
- 作者头像
- 作者简介
- Cloudflare Analytics token
- Giscus 评论配置

### 改全站布局

文件：

```text
src/layouts/BaseLayout.astro
```

负责导航、footer、SEO meta、RSS link、manifest、结构化数据插槽。

### 改文章页

文件：

```text
src/pages/posts/[...slug].astro
```

负责文章详情页，包括目录、阅读时间、作者卡、上一篇/下一篇、评论区、代码复制脚本。

### 改视觉样式

文件：

```text
src/styles/global.css
```

负责首页、文章列表、文章详情、作者卡、404、移动端适配等样式。

### 改作者卡

文件：

```text
src/components/AuthorCard.astro
```

作者卡内容大部分来自 `src/site.config.ts`。

## 评论区启用方法

当前评论区已经接入 Giscus，但还没有填 GitHub Discussions 的仓库 ID 和分类 ID，所以线上显示“评论区已预留”。

启用步骤：

1. 到 GitHub 仓库开启 Discussions。
2. 安装 Giscus GitHub App。
3. 在 https://giscus.app/ 选择仓库和 Discussions 分类。
4. 复制生成的 `repo-id` 和 `category-id`。
5. 在 Cloudflare Pages 环境变量里添加：

```text
PUBLIC_GISCUS_REPO=Frank-debug666/bestsdz-blog
PUBLIC_GISCUS_REPO_ID=你的 repo id
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=你的 category id
```

6. 重新部署。

## 访问统计启用方法

Cloudflare Web Analytics 已经预留代码入口。

启用步骤：

1. 在 Cloudflare 创建 Web Analytics site。
2. 复制 token。
3. 在 Cloudflare Pages 环境变量添加：

```text
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=你的 token
```

4. 重新部署。

## 最后一次功能验收

验收时间：2026-06-18

验收目标：正式域名 `https://bestsdz.xyz/`

### 构建检查

命令：

```powershell
npm run build
```

结果：

```text
0 errors
0 warnings
0 hints
41 pages built
```

### 正式站 HTTP 检查

| 功能 | URL | 结果 |
| --- | --- | --- |
| 主页 | `/` | 通过，包含站点标题和最新文章 |
| 文章列表 | `/posts/` | 通过，包含搜索框和全部文章 |
| 文章详情 | `/posts/what-is-neural-network/` | 通过，包含作者卡、评论区、JSON-LD、代码复制脚本 |
| AI 路线 | `/ai-roadmap/` | 通过 |
| 关于页 | `/about/` | 通过，包含“我是史迪仔” |
| RSS | `/rss.xml` | 通过，包含 RSS item |
| Sitemap | `/sitemap.xml` | 通过，包含文章 URL |
| Robots | `/robots.txt` | 通过，包含 sitemap 地址 |
| Manifest | `/site.webmanifest` | 通过，包含站点名和图标 |
| Search JSON | `/search.json` | 通过，15 篇文章，PyTorch 匹配 4 篇 |
| 404 | `/not-a-real-road/` | 通过，返回自定义 404 文案 |

### 交互检查

- 文章搜索逻辑：`PyTorch` 关键词匹配 4 篇文章。
- 文章页作者卡：线上文章页包含“我是史迪仔”。
- 文章页 SEO：线上文章页包含 `BlogPosting` JSON-LD。
- 代码复制：文章页脚本已加载；当前已发布文章主要是说明文，没有 fenced code block 时不会显示按钮，后续文章加入代码块后自动出现。
- 移动端适配：之前已修复文章页横向溢出；当前 CSS 对文章目录和正文设置了 `minmax(0, 1fr)` 与 `min-width: 0`。

说明：浏览器控制插件在最终长流程验收中发生超时重置，因此最后一次完整验收以 `npm run build`、正式 URL HTTP 探针、搜索索引数据和源码交互逻辑为准。此前作者卡、文章页和移动端溢出已通过浏览器渲染检查。

## 目前还可以继续做的事

这些不是阻塞项，只是后续增强：

- 开启 Giscus 评论区。
- 开启 Cloudflare Web Analytics。
- 给更多文章加入代码示例，让“复制代码”功能真正展示出来。
- 增加文章系列页，例如“PyTorch 入门系列”“机器学习项目复盘系列”。
- 增加 Open Graph 专用分享图模板。
- 给每篇文章补 `updatedDate`，便于 sitemap 和读者识别更新时间。
