# 去你想去的地方：维护与验收手册

最后更新：2026-07-28

- 正式站：<https://bestsdz.xyz/>
- GitHub：<https://github.com/Frank-debug666/bestsdz-blog>
- Cloudflare Pages 项目：`bestsdz-blog`
- 作者：会飞的蒲公英

## 当前基线

- 67 篇公开文章
- 59 个配套视频
- 225 个 Sitemap 地址
- 本地构建输出 226 个页面
- Giscus 评论已启用
- Cloudflare Web Analytics 已启用
- 文章浏览量接口使用 Cloudflare Pages KV `BLOG_VIEWS`

## 主要路由

| 页面 | 路由 |
| --- | --- |
| 首页 | `/` |
| 新手入口 | `/start/` |
| 学习路线 | `/ai-roadmap/` |
| 视频中心 | `/videos/` |
| 术语词典 | `/glossary/` |
| 文章归档 | `/posts/` |
| 作品 | `/projects/echo-memory/` |
| 搜索 | `/search/` |
| 关于 | `/about/` |
| RSS | `/rss.xml` |
| Sitemap | `/sitemap.xml` |

## 内容发布流程

文章位于 `src/content/posts/`，封面放在 `public/images/covers/`，视频与
字幕放在 `public/videos/`。

```powershell
npm ci
npm run build
npx wrangler pages deploy dist --project-name bestsdz-blog --branch main
git add .
git commit -m "Publish new post"
git push
```

部署前必须保证 `npm run build` 的检查结果为 0 errors、0 warnings、
0 hints。

## 配置与代码入口

| 用途 | 文件 |
| --- | --- |
| 站点、作者、评论与统计 | `src/site.config.ts` |
| 导航、SEO 与全局脚本 | `src/layouts/BaseLayout.astro` |
| 文章详情页 | `src/pages/posts/[...slug].astro` |
| 视频中心 | `src/pages/videos.astro` |
| 全局样式 | `src/styles/global.css` |
| Cloudflare Pages 与 KV | `wrangler.toml` |
| GitHub Pages 备份 | `.github/workflows/deploy.yml` |

## 部署边界

Cloudflare Pages 是正式环境，支持 `functions/api/views.ts` 和 KV 浏览量。
GitHub Pages 只作为静态备份，能够展示页面，但不会运行 Pages Functions，
因此不具备完整的浏览量能力。

`public/CNAME` 与 GitHub Pages 工作流目前保留。只有明确取消 GitHub Pages
备份后，才能同时移除这两项。

## 第三方功能

Giscus 的公开仓库参数集中在 `src/site.config.ts`，可由
`PUBLIC_GISCUS_*` 环境变量覆盖。

Cloudflare Web Analytics 使用
`PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`，真实 token 只能存放在 Cloudflare
项目变量或被 Git 忽略的 `.env.local` 中。

完整配置步骤见 `BLOG_FEATURE_SETUP.md`。

## 2026-07-28 验收记录

- Git 工作区与远端 `main` 同步。
- GitHub 最新提交：`e93198d`。
- GitHub Pages 最新工作流执行成功。
- 线上首页与本地构建首页 SHA256 完全一致。
- Sitemap 225 个地址全部返回 HTTP 200。
- 升级后页面引用的 172 个图片、视频、字幕、样式和脚本资源全部可访问。
- 浏览器控制台没有站点代码错误；Giscus 在文章尚无讨论时会输出预期提示。
- 仓库和原稿文本均为有效 UTF-8，未发现替换字符或常见错误转码。
- 正式站 HTML 明确返回 `charset=utf-8`。
- Astro 已升级至 7.1.4，`npm audit` 为 0 vulnerabilities。
- 第 45～59 课中文字幕已经转换为 VTT 并接入播放器。

## 日常验收清单

1. 运行 `npm run build`。
2. 打开首页、最新文章、视频中心、学习路线和搜索页。
3. 检查最新文章的视频、中文字幕、目录、复制代码和评论。
4. 检查移动端导航、长标题、图片和视频是否溢出。
5. 检查 `/rss.xml`、`/sitemap.xml`、`/search.json`。
6. 部署后确认正式首页与最新文章已经更新。

## 已知维护事项

- MP4 使用 Git LFS，规则必须覆盖 `public/` 下的所有子目录。
- CSDN 静态资源可能被外部文章引用，不能只依据站内零引用删除。
- Astro 主版本升级后必须重新执行全站构建和浏览器验收。
- 发布路线以 `AI-course-publishing-roadmap.md` 为准。
