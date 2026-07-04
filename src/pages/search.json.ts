import { getCollection } from 'astro:content';
import { getCanonicalTags } from '../content-taxonomy';
import { concepts } from '../concepts';

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => {
      const tags = getCanonicalTags(post.data.tags);
      return {
        id: post.id,
        type: '文章',
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

  const conceptResults = concepts.map((concept) => ({
    id: concept.slug,
    type: '概念',
    title: concept.title,
    description: concept.summary,
    tags: [concept.category, concept.level, ...concept.tags],
    url: `/glossary/${concept.slug}/`,
    date: '',
    searchText: [concept.title, concept.summary, concept.plain, concept.category, concept.level, concept.aliases.join(' '), concept.tags.join(' ')]
      .join(' ')
      .toLowerCase(),
  }));

  return new Response(JSON.stringify({ posts, concepts: conceptResults, items: [...conceptResults, ...posts] }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
