# 博客第三方功能配置

最后核对：2026-07-28

Giscus 评论和 Cloudflare Web Analytics 已经接入并在线启用。本文件记录重新
部署、迁移账号或轮换参数时需要检查的位置，不保存任何密钥。

## Cloudflare Web Analytics

在 Cloudflare Pages 项目里添加环境变量：

```text
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=你的 Cloudflare Web Analytics token
```

重新部署后，页面会加载 Cloudflare 统计脚本。不要把真实 token 写入仓库；
本地开发时使用被 `.gitignore` 忽略的 `.env.local`。

## Giscus 评论区

1. 在 GitHub 仓库开启 Discussions。
2. 安装并授权 Giscus GitHub App。
3. 在 giscus.app 选择仓库和 Discussion 分类，复制生成的参数。
4. 在 Cloudflare Pages 项目里添加环境变量：

```text
PUBLIC_GISCUS_REPO=Frank-debug666/bestsdz-blog
PUBLIC_GISCUS_REPO_ID=你的 repo id
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=你的 category id
```

当前仓库和分类的默认公开参数已写在 `src/site.config.ts`，环境变量可以覆盖
默认值。重新部署后，文章页底部的“留言讨论”会加载 Giscus 评论区。

## 上线后验证

1. 打开任意文章，确认评论框正常加载。
2. 查看页面源代码，确认存在 `giscus.app/client.js`。
3. 查看首页源代码，确认存在 `static.cloudflareinsights.com/beacon.min.js`。
4. 不要在 Git 历史、截图或公开日志中暴露 Cloudflare token。
