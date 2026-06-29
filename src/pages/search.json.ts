import { getCollection } from 'astro:content';
import { getCanonicalTags } from '../content-taxonomy';

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => {
      const tags = getCanonicalTags(post.data.tags);
      return {
        id: post.id,
        title: post.data.title,
        description: post.data.description,
        tags,
        url: `/posts/${post.id}/`,
        date: post.data.pubDate.toISOString(),
        searchText: [post.data.title, post.data.description, tags.join(' ')]
          .join(' ')
          .toLowerCase(),
      };
    });

  return new Response(JSON.stringify({ posts }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
