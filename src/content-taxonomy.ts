import type { CollectionEntry } from 'astro:content';

export const tagAliases: Record<string, string> = {
  人工智能: 'AI基础',
  零基础: 'AI基础',
  分类: '机器学习',
  回归: '机器学习',
  监督学习: '机器学习',
  无监督学习: '机器学习',
  项目流程: '项目实战',
  项目复盘: '项目实战',
  数据预处理: '数据清洗',
  代码实战: '项目实战',
  F1: '模型评估',
  交叉验证: '模型评估',
  GridSearchCV: '调参',
  Linear: 'PyTorch',
  模型训练: 'PyTorch',
  标准化: '特征工程',
};

export interface TopicDefinition {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  tags: string[];
}

export const topics: TopicDefinition[] = [
  {
    slug: 'ai-basics',
    title: 'AI 入门地图',
    kicker: '从零开始',
    description: '先建立 AI、机器学习、深度学习和模型训练的整体概念，再进入代码与项目。',
    tags: ['AI基础', '机器学习', '深度学习', '神经网络'],
  },
  {
    slug: 'machine-learning',
    title: '机器学习基础',
    kicker: '算法与评估',
    description: '围绕数据、特征、传统算法、评估指标和调参，把机器学习项目的基本功打牢。',
    tags: ['机器学习', '特征工程', '数据清洗', '模型评估', '调参', '决策树', '随机森林', 'KNN'],
  },
  {
    slug: 'pytorch-deep-learning',
    title: 'PyTorch 与深度学习',
    kicker: '训练流程',
    description: '从 Tensor、网络层、DataLoader 到完整训练循环，逐步理解深度学习工程化流程。',
    tags: ['PyTorch', '深度学习', '神经网络', '损失函数', '梯度下降'],
  },
  {
    slug: 'nlp-project',
    title: '中文文本分类项目',
    kicker: 'NLP 实战',
    description: '从中文分词、停用词、TF-IDF 到完整文本分类项目，串起 NLP 项目落地链路。',
    tags: ['NLP', '文本分类', '中文分词', 'TF-IDF', '项目实战'],
  },
  {
    slug: 'projects',
    title: '项目实战与复盘',
    kicker: '作品集',
    description: '把模型训练、接口、页面、复盘和写作过程集中展示，让博客变成能被展示的作品集。',
    tags: ['项目实战', '学习记录', '博客运营'],
  },
];

export function canonicalizeTag(tag: string) {
  return tagAliases[tag] ?? tag;
}

export function getCanonicalTags(tags: readonly string[]) {
  return Array.from(new Set(tags.map(canonicalizeTag))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function getPostTopics(post: CollectionEntry<'posts'>) {
  const postTags = new Set(getCanonicalTags(post.data.tags));
  return topics.filter((topic) => topic.tags.some((tag) => postTags.has(tag)));
}

export function getTopicPosts(topic: TopicDefinition, posts: CollectionEntry<'posts'>[]) {
  return posts
    .map((post) => {
      const postTags = new Set(getCanonicalTags(post.data.tags));
      const score = topic.tags.reduce((total, tag) => total + (postTags.has(tag) ? 1 : 0), 0);
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf())
    .map(({ post }) => post);
}

export function getRelatedPosts(
  currentPost: CollectionEntry<'posts'>,
  posts: CollectionEntry<'posts'>[],
  limit = 3,
) {
  const currentTags = new Set(getCanonicalTags(currentPost.data.tags));
  const currentTopics = new Set(getPostTopics(currentPost).map((topic) => topic.slug));

  return posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      const postTags = getCanonicalTags(post.data.tags);
      const tagScore = postTags.reduce((total, tag) => total + (currentTags.has(tag) ? 1 : 0), 0);
      const topicScore = getPostTopics(post).reduce(
        (total, topic) => total + (currentTopics.has(topic.slug) ? 1 : 0),
        0,
      );

      return {
        post,
        score: tagScore * 3 + topicScore * 2,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf())
    .slice(0, limit)
    .map(({ post }) => post);
}
