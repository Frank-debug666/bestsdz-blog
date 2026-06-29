import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCanonicalTags, topics } from '../content-taxonomy';

const site = 'https://bestsdz.xyz';

function absoluteUrl(path: string) {
  return new URL(path, site).toString();
}

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const tags = Array.from(new Set(posts.flatMap((post) => getCanonicalTags(post.data.tags)))).sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );

  const urls = [
    absoluteUrl('/'),
    absoluteUrl('/ai-roadmap/'),
    absoluteUrl('/topics/'),
    absoluteUrl('/posts/'),
    absoluteUrl('/about/'),
    ...topics.map((topic) => absoluteUrl(`/topics/${topic.slug}/`)),
    ...posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => absoluteUrl(`/posts/${post.id}/`)),
    ...tags.map((tag) => absoluteUrl(`/tags/${encodeURIComponent(tag)}/`)),
  ];

  return new Response(`${urls.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
