import type { ConceptEntry } from './concepts';

interface CourseGuideInput {
  title: string;
  description: string;
  tags: readonly string[];
  stageTitle?: string;
  sectionTitle?: string;
  previousTitle?: string;
  nextTitle?: string;
  concepts: ConceptEntry[];
}

function has(tags: readonly string[], keyword: string) {
  return tags.includes(keyword);
}

export function buildCourseGuide(input: CourseGuideInput) {
  const area = input.stageTitle ?? input.sectionTitle ?? 'AI 学习路线';
  const conceptNames = input.concepts.map((concept) => concept.title);

  const outcomes = [
    `说清楚「${input.title}」解决的核心问题`,
    `知道它在「${area}」中的位置`,
    conceptNames.length > 0
      ? `把 ${conceptNames.slice(0, 3).join('、')} 这些关键词联系起来`
      : `把文章中的关键术语放回完整学习路线中`,
  ];

  const prerequisites = input.previousTitle
    ? [`建议先读完上一篇：${input.previousTitle}`, '能区分输入、输出、数据和模型目标。']
    : has(input.tags, 'AI基础')
      ? ['不需要编程基础，先有基本的问题意识即可。', '知道 AI 不是单一工具，而是一组方法和应用。']
      : ['建议先读完新手入口或当前阶段前几篇文章。', '至少能说清楚数据、模型、训练目标这三个词。'];

  const pitfalls = [
    '不要只记定义，要追问它解决了什么问题。',
    has(input.tags, 'PyTorch')
      ? '不要只看 API 名字，要同时关注输入输出 shape 和训练流程。'
      : has(input.tags, '模型评估')
        ? '不要只看一个指标，要结合任务目标判断模型是否真的有用。'
        : has(input.tags, '项目实战')
          ? '不要只看模型分数，要把数据、特征、接口和复盘一起看。'
          : '不要把概念孤立背下来，要放回数据到结果的完整链路里。',
  ];

  const exercises = [
    `用 3 句话向一个零基础朋友解释「${input.title}」。`,
    input.concepts[0]
      ? `打开概念库里的「${input.concepts[0].title}」，补一遍它和本文的关系。`
      : '把本文出现的 3 个关键词写到自己的学习笔记里。',
    input.nextTitle ? `读下一课「${input.nextTitle}」前，先写下你认为它会解决的问题。` : '回到路线页，选择下一阶段继续补齐。',
  ];

  return {
    outcomes,
    prerequisites,
    concepts: input.concepts,
    pitfalls,
    exercises,
    nextSuggestion: input.nextTitle ? `下一步建议读「${input.nextTitle}」。` : '这一阶段读完后，建议回到路线页选择下一阶段。',
  };
}
