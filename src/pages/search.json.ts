import { getCollection } from 'astro:content';

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags,
      url: `/posts/${post.id}/`,
      date: post.data.pubDate.toISOString(),
      searchText: [post.data.title, post.data.description, post.data.tags.join(' ')]
        .join(' ')
        .toLowerCase(),
    }));

  return new Response(JSON.stringify({ posts }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
