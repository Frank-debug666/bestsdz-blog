export const siteConfig = {
  name: '去你想去的地方',
  url: 'https://bestsdz.xyz',
  description: '记录沿途的见闻、AI 学习笔记、项目复盘和那些值得停留的瞬间。',
  author: {
    name: '会飞的蒲公英',
    avatar: '/logo-clean.png?v=20260706-dandelion',
    github: 'https://github.com/Frank-debug666',
    role: 'AI 学习路上的记录者',
    location: '在路上，也在训练循环里',
    bio: '我会把旅行里的风景、学习里的卡点、项目里的复盘都写下来。这个博客不追求一步到位的完美，更在意把每一次出发和每一次弄懂，认真留档。',
  },
  cloudflareAnalyticsToken: import.meta.env.PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN ?? '',
  giscus: {
    repo: import.meta.env.PUBLIC_GISCUS_REPO ?? 'Frank-debug666/bestsdz-blog',
    repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? 'R_kgDOS8A9rg',
    category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'Announcements',
    categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? 'DIC_kwDOS8A9rs4C_ZTD',
  },
};
