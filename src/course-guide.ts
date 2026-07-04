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

function buildConceptReview(input: CourseGuideInput, area: string, conceptNames: string[]) {
  if (input.concepts.length > 0) {
    return input.concepts.slice(0, 4).map((concept) => {
      const related = concept.relatedPostIds.length > 0 ? '前面或后面会反复用到它。' : '它是理解本文的支点。';
      return `【${concept.title}】${concept.plain} ${related}`;
    });
  }

  if (input.previousTitle) {
    return [
      `上一篇「${input.previousTitle}」已经铺过一个局部问题，这一课继续把它放进「${area}」里。`,
      '读之前先回想三个词：输入是什么、输出是什么、模型或流程要优化什么。',
    ];
  }

  return [
    `这一课属于「${area}」，先不用追求公式完整，先抓住它解决的问题。`,
    conceptNames.length > 0
      ? `读正文时重点盯住 ${conceptNames.slice(0, 2).join('、')} 这几个关键词。`
      : '读正文时重点盯住“问题、方法、结果”三件事。',
  ];
}

function buildSelfCheck(input: CourseGuideInput) {
  if (has(input.tags, 'PyTorch')) {
    return [
      {
        question: '如果一段 PyTorch 代码报 device 不一致，第一步应该检查什么？',
        answer: '先检查模型参数、输入 Tensor、标签 Tensor 是否在同一个设备上。常见修正是把它们统一 `.to(device)`。',
      },
      {
        question: '为什么学习 PyTorch 时不能只看 API 名字？',
        answer: '因为训练是否正确经常取决于 shape、dtype、device 和梯度流，API 名字只能告诉你工具，不会保证数据契约正确。',
      },
      {
        question: '读完本文后，至少应该能画出哪条训练主线？',
        answer: '`输入数据 → forward → loss → backward → optimizer.step()`，并知道本文主题位于这条链路的哪一环。',
      },
    ];
  }

  if (has(input.tags, '项目实战') || has(input.tags, '文本分类') || has(input.tags, 'NLP')) {
    return [
      {
        question: '这个环节的输入和输出分别是什么？',
        answer: '项目文要先说清数据流。输入通常是原始数据或上一步结果，输出必须能被下一步稳定复用。',
      },
      {
        question: '如果训练和预测效果对不上，优先排查哪件事？',
        answer: '优先排查预处理是否一致，例如分词、TF-IDF 词表、标签映射、标准化器是否沿用训练阶段的同一套对象。',
      },
      {
        question: '为什么项目文章不能只看最终分数？',
        answer: '因为真实项目还要看数据质量、错误样本、部署入口、复用方式和失败边界。',
      },
    ];
  }

  if (has(input.tags, '模型评估')) {
    return [
      {
        question: '为什么不能只看一个指标？',
        answer: '单一指标会掩盖类别不平衡、业务代价和错误分布。评估要结合任务目标、混淆矩阵和具体错误样本。',
      },
      {
        question: '什么时候准确率会误导你？',
        answer: '当类别不平衡或不同错误代价差异很大时，准确率可能很高但模型仍然没解决关键问题。',
      },
    ];
  }

  return [
    {
      question: `用一句话说清「${input.title}」解决了什么问题。`,
      answer: '合格答案不是复述标题，而是说清它在“数据进入模型、模型学习、结果评估或项目落地”中的作用。',
    },
    {
      question: '这篇文章和上一课或下一课是什么关系？',
      answer: input.nextTitle
        ? `它应该为下一课「${input.nextTitle}」铺路：读完后要知道下一课为什么自然出现。`
        : '它应该能放回完整学习路线里：读完后要知道自己下一步该补概念、补代码还是补项目。',
    },
  ];
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
  const conceptReview = buildConceptReview(input, area, conceptNames);
  const selfCheck = buildSelfCheck(input);

  return {
    outcomes,
    prerequisites,
    conceptReview,
    concepts: input.concepts,
    pitfalls,
    exercises,
    selfCheck,
    nextSuggestion: input.nextTitle ? `下一步建议读「${input.nextTitle}」。` : '这一阶段读完后，建议回到路线页选择下一阶段。',
  };
}
