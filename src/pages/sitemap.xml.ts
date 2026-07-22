import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCanonicalTags, topics } from '../content-taxonomy';
import { concepts } from '../concepts';

const site = 'https://bestsdz.xyz';

function urlEntry(path: string, lastmod?: Date, priority = '0.7') {
  const loc = new URL(path, site).toString();
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const tags = Array.from(new Set(posts.flatMap((post) => getCanonicalTags(post.data.tags)))).sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );

  const staticPages = [
    urlEntry('/', undefined, '1.0'),
    urlEntry('/ai-roadmap/', undefined, '0.9'),
    urlEntry('/start/', undefined, '0.9'),
    urlEntry('/stage-summaries/', undefined, '0.8'),
    urlEntry('/videos/', undefined, '0.8'),
    urlEntry('/search/', undefined, '0.7'),
    urlEntry('/glossary/', undefined, '0.9'),
    urlEntry('/topics/', undefined, '0.9'),
    urlEntry('/posts/', undefined, '0.9'),
    urlEntry('/projects/echo-memory/', undefined, '0.9'),
    urlEntry('/about/', undefined, '0.6'),
  ];

  const postPages = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => urlEntry(`/posts/${post.id}/`, post.data.updatedDate ?? post.data.pubDate, '0.8'));

  const tagPages = tags.map((tag) => urlEntry(`/tags/${encodeURIComponent(tag)}/`, undefined, '0.5'));
  const topicPages = topics.map((topic) => urlEntry(`/topics/${topic.slug}/`, undefined, '0.8'));
  const conceptPages = concepts.map((concept) => urlEntry(`/glossary/${concept.slug}/`, undefined, '0.8'));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...topicPages, ...conceptPages, ...postPages, ...tagPages].join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
