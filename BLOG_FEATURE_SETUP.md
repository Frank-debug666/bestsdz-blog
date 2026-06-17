# 博客可选功能配置

下面两个功能已经接入代码，但需要第三方参数才会正式启用。

## Cloudflare Web Analytics

在 Cloudflare Pages 项目里添加环境变量：

```text
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=你的 Cloudflare Web Analytics token
```

重新部署后，页面会自动加载 Cloudflare 统计脚本。

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

重新部署后，文章页底部的“留言讨论”会自动变成正式评论区。
