export const siteConfig = {
  cloudflareAnalyticsToken: import.meta.env.PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN ?? '',
  giscus: {
    repo: import.meta.env.PUBLIC_GISCUS_REPO ?? 'Frank-debug666/bestsdz-blog',
    repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? '',
    category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'Announcements',
    categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? '',
  },
};
