export type LearningLevel = '零基础' | '初级' | '进阶' | '项目实战';

export interface ContentSection {
  id: string;
  title: string;
  description: string;
  level: LearningLevel | '持续更新';
  postIds: string[];
}

export interface LearningStage {
  id: string;
  number: string;
  title: string;
  description: string;
  positioning: string;
  outcome: string;
  readingMode: string;
  status: '已完成' | '更新中' | '规划中';
  level: LearningLevel;
  startLesson: number;
  postIds: string[];
}

export interface FutureStage {
  number: string;
  range: string;
  title: string;
  description: string;
  outcome: string;
  status: '预告' | '毕业项目';
  topics: string[];
}

export interface GraduationProject {
  title: string;
  articleCount: string;
  standard: string;
}

export const contentSections: ContentSection[] = [
  {
    id: 'ai-zero',
    title: 'AI 从零开始',
    description: '先认识 AI 的边界和基本地图，再决定从哪里开始学。',
    level: '零基础',
    postIds: ['what-is-ai', 'ai-ml-dl-generative-ai'],
  },
  {
    id: 'machine-learning',
    title: '机器学习基础',
    description: '理解任务、数据、评价指标以及模型为什么会学偏。',
    level: '零基础',
    postIds: [
      'supervised-vs-unsupervised-learning',
      'classification-vs-regression',
      'features-labels-datasets',
      'train-validation-test-sets',
      'classification-metrics',
      'overfitting-underfitting-data-leakage',
    ],
  },
  {
    id: 'deep-learning',
    title: '深度学习原理',
    description: '从神经网络出发，理解激活、误差和参数更新。',
    level: '初级',
    postIds: [
      'what-is-neural-network',
      'activation-function',
      'loss-function',
      'gradient-descent',
      'forward-and-backpropagation',
      'cross-entropy-loss',
    ],
  },
  {
    id: 'pytorch',
    title: 'PyTorch 入门',
    description: '把概念放进代码，独立写出一条可以运行的训练流程。',
    level: '初级',
    postIds: [
      'what-is-tensor',
      'pytorch-linear-layer',
      'pytorch-dataloader',
      'pytorch-training-flow',
      'pytorch-tensor-dtype-device-indexing',
      'pytorch-autograd-requires-grad-backward',
      'computation-graph-gradient-accumulation',
      'shape-data-contract',
      'reshape-view-transpose-broadcast',
    ],
  },
  {
    id: 'traditional-ml',
    title: '传统机器学习基础',
    description: '从项目流程、数据清洗、特征工程和数值缩放开始，补齐进入算法之前的数据基本功。',
    level: '初级',
    postIds: [
      'machine-learning-project-flow',
      'data-cleaning-first-lesson',
      'pandas-data-cleaning-practice',
      'what-is-feature-engineering',
      'label-encoding-vs-one-hot',
      'standardization-vs-normalization',
      'linear-regression-basics',
      'regression-metrics-mae-mse-rmse-r2',
      'logistic-regression-for-classification',
      'knn-classification',
      'decision-tree-basics',
      'random-forest-basics',
      'ensemble-learning-bagging-boosting',
      'model-evaluation-cross-validation',
    ],
  },
  {
    id: 'projects',
    title: '项目实战',
    description: '用真实项目串起数据、模型、接口和复盘。',
    level: '项目实战',
    postIds: [
      'spam-sms-project-retrospective',
      'rf-text-classification-system',
      'chinese-text-encoding-cleaning-normalization',
      'chinese-tokenization-stopwords',
      'countvectorizer-bag-of-words',
      'tfidf-for-chinese-text',
      'tfidf-logistic-regression-baseline',
      'text-classification-evaluation-confusion-matrix',
      'save-load-text-classification-model',
      'streamlit-text-classification-demo',
    ],
  },
  {
    id: 'llm',
    title: '大模型与应用',
    description: '沿着 RNN、Attention 和 Transformer 进入大模型应用。',
    level: '进阶',
    postIds: [],
  },
  {
    id: 'writing',
    title: '博客与学习记录',
    description: '记录写作系统、博客建设和持续学习的方法。',
    level: '持续更新',
    postIds: ['why-start-ai-blog', 'astro-blog-start', 'build-writing-system', 'toolbox'],
  },
];

export const learningStages: LearningStage[] = [
  {
    id: 'locked-first-20',
    number: '第一部分',
    title: '已锁定的前 20 篇',
    description: '从 AI 基本概念、机器学习任务、深度学习直觉、PyTorch 入门到中文文本分类项目全貌。',
    positioning: '这是整条路线的入门底座，标题、编号、日期和顺序以当前发布清单为准。前 18 篇负责概念和 PyTorch 入门，第 19-20 篇负责端到端项目体验。',
    outcome: '能说清 AI、机器学习、深度学习、PyTorch 训练流程和一个中文文本分类项目的大致链路。',
    readingMode: '零基础建议顺序阅读；已有基础的读者可以把它当作路线地图和查漏补缺清单。',
    status: '已完成',
    level: '零基础',
    startLesson: 1,
    postIds: [
      'what-is-ai',
      'ai-ml-dl-generative-ai',
      'supervised-vs-unsupervised-learning',
      'classification-vs-regression',
      'features-labels-datasets',
      'train-validation-test-sets',
      'classification-metrics',
      'overfitting-underfitting-data-leakage',
      'what-is-neural-network',
      'activation-function',
      'loss-function',
      'gradient-descent',
      'cross-entropy-loss',
      'forward-and-backpropagation',
      'what-is-tensor',
      'pytorch-linear-layer',
      'pytorch-dataloader',
      'pytorch-training-flow',
      'spam-sms-project-retrospective',
      'rf-text-classification-system',
    ],
  },
  {
    id: 'traditional-ml',
    number: '阶段二',
    title: '传统机器学习基础（21～34）',
    description: '补齐文本分类项目背后的数据处理、算法、评估和模型选择知识。',
    positioning: '前面 1-20 篇已经见过梯度下降、损失函数和训练流程。现在退一步，用最简单的模型把“数据 → 训练 → 评估 → 选择”这条主线彻底走通。这是回顾加深，不是突然倒车。',
    outcome: '拿到一份结构化表格数据，独立完成清洗、特征工程、建模、评估、模型选择和保存，并用规范流程比较多个算法。',
    readingMode: '建议系统读。做项目时遇到数据和模型选择问题，也可以按需回查。',
    status: '已完成',
    level: '初级',
    startLesson: 21,
    postIds: [
      'machine-learning-project-flow',
      'data-cleaning-first-lesson',
      'pandas-data-cleaning-practice',
      'what-is-feature-engineering',
      'label-encoding-vs-one-hot',
      'standardization-vs-normalization',
      'linear-regression-basics',
      'regression-metrics-mae-mse-rmse-r2',
      'logistic-regression-for-classification',
      'knn-classification',
      'decision-tree-basics',
      'random-forest-basics',
      'ensemble-learning-bagging-boosting',
      'model-evaluation-cross-validation',
    ],
  },
  {
    id: 'text-classification',
    number: '阶段三',
    title: '文本分类项目（35～42）',
    description: '重新拆解中文文本分类链路，从编码清洗、分词、向量化、评估、保存一路做到演示页面。',
    positioning: '第 19-20 篇是端到端体验，本阶段是逐环节吃透。不是重讲，而是把中文文本分类的每个关键步骤拆开、讲透、能复用。',
    outcome: '从一份原始中文文本出发，独立完成清洗、分词、向量化、训练、评估、保存和演示页面，并能解释每个环节为什么这么做。',
    readingMode: '如果已经吃透第 19-20 课，可按薄弱环节跳读；否则建议顺序阅读。',
    status: '已完成',
    level: '项目实战',
    startLesson: 35,
    postIds: [
      'chinese-text-encoding-cleaning-normalization',
      'chinese-tokenization-stopwords',
      'countvectorizer-bag-of-words',
      'tfidf-for-chinese-text',
      'tfidf-logistic-regression-baseline',
      'text-classification-evaluation-confusion-matrix',
      'save-load-text-classification-model',
      'streamlit-text-classification-demo',
    ],
  },
  {
    id: 'pytorch-deepening',
    number: '阶段四',
    title: 'PyTorch 深度学习基础（43～58）',
    description: '在前 20 篇 PyTorch 入门上继续深化，补齐张量操作、自动微分、优化器家族和训练排错能力。',
    positioning: '本阶段补齐实际训练需要的张量操作、自动微分、优化器家族和训练排错能力。它决定你能不能独立读懂任何 PyTorch 训练脚本，并诊断常见训练问题。',
    outcome: '独立搭建一个 PyTorch 训练脚本，正确处理 Shape、device、梯度清空、优化器选择和学习率策略，并能根据 loss/accuracy 曲线诊断训练问题。',
    readingMode: '当前更新主线，建议跟更；每篇都要配合代码自检。',
    status: '更新中',
    level: '初级',
    startLesson: 43,
    postIds: [
      'pytorch-tensor-dtype-device-indexing',
      'pytorch-autograd-requires-grad-backward',
      'computation-graph-gradient-accumulation',
      'shape-data-contract',
      'reshape-view-transpose-broadcast',
    ],
  },
];

export const futureStages: FutureStage[] = [
  {
    number: '阶段五',
    range: '59-68',
    title: '深度学习项目',
    description: '通过回归、二维分类、表格分类和图像分类项目，把 Dataset、模型、损失、优化器、评估和推理串起来。',
    outcome: '能独立完成一个完整深度学习项目，从数据到推理全流程，并整理出可复用的项目目录结构。',
    status: '预告',
    topics: ['回归项目', '二维分类', '表格分类', 'CNN', '项目模板'],
  },
  {
    number: '阶段六',
    range: '69-78',
    title: 'NLP 与序列模型',
    description: '从文本编号进入 Embedding、FastText、RNN、LSTM 和文本生成，先理解序列模型的能力与局限。',
    outcome: '能把中文文本处理成序列数据，用 FastText/RNN/LSTM 完成分类或字符级生成。',
    status: '预告',
    topics: ['Token 与词表', 'Padding 与 Mask', 'Embedding', 'RNN/LSTM'],
  },
  {
    number: '阶段七',
    range: '79-90',
    title: 'Transformer 与 BERT',
    description: '放慢 Attention 推导过程，从 RNN 的局限进入 Self-Attention、Transformer Encoder 和 BERT 分类。',
    outcome: '能讲清 Self-Attention 的计算流程，并用 BERT 完成文本分类训练和推理。',
    status: '预告',
    topics: ['QKV', 'Self-Attention', 'Position Encoding', 'BERT'],
  },
  {
    number: '阶段八',
    range: '91-100',
    title: '大模型开发',
    description: '从安全调用 API 开始，逐步掌握提示词、结构化输出、Few-shot、ReAct 和工具调用。',
    outcome: '能写出稳定提示词模板，让模型按 JSON 返回结果，并实现一个能调用外部工具的对话助手。',
    status: '预告',
    topics: ['模型 API', '流式输出', '结构化输出', 'Tool Calling'],
  },
  {
    number: '阶段九',
    range: '101-110',
    title: 'RAG 与知识库',
    description: '掌握从文档进入知识库到检索、重排、引用回答和评估的完整流程。',
    outcome: '能从 PDF/Markdown 出发完成切分、向量化、检索、重排和带引用回答，并用测试集评估质量。',
    status: '预告',
    topics: ['Chunk', 'Embedding', '向量数据库', 'RAG 评估'],
  },
  {
    number: '阶段十',
    range: '111-116',
    title: 'Dify / RAGFlow',
    description: '围绕 AI 应用工程问题拆解工具，不写成按钮说明，而是解释工作流如何解决真实问题。',
    outcome: '能设计 Dify 工作流，处理变量流和节点依赖，并配置知识检索减少无依据回答。',
    status: '预告',
    topics: ['工作流', '变量流', '知识检索', '权限与日志'],
  },
  {
    number: '阶段十一',
    range: '117-125',
    title: '部署与优化',
    description: '先完成应用服务化，再用通俗方式理解模型压缩，最后把模型变成能给别人用的服务。',
    outcome: '能把模型打包成 Docker API 服务，并根据设备和业务目标选择模型压缩方案。',
    status: '预告',
    topics: ['Streamlit/Flask', 'Docker', '量化', '蒸馏'],
  },
  {
    number: '阶段十二',
    range: '126+',
    title: '综合毕业项目',
    description: '综合项目不无限拉长。每个项目都有毕业标准，完成 6 个方向中的任意 3 个，即视为整条路线毕业。',
    outcome: '能交付至少 3 个完整 AI 项目作品，覆盖训练、评估、服务化、知识库或工作流自动化。',
    status: '毕业项目',
    topics: ['中文文本分类系统', 'BERT 服务', '企业知识库', 'Dify 工作流'],
  },
];

export const graduationProjects: GraduationProject[] = [
  {
    title: '从训练到部署的中文文本分类系统',
    articleCount: '3 篇',
    standard: '完成训练、评估、保存、Flask API 与 Docker 部署，跑通测试集并输出指标报告。',
  },
  {
    title: 'BERT 文本分类、模型压缩与 API 服务',
    articleCount: '3 篇',
    standard: '完成 BERT 训练、量化和 API 服务，对比压缩前后的延迟、显存与 F1。',
  },
  {
    title: '带引用和评估的企业知识库问答系统',
    articleCount: '4 篇',
    standard: '完成文档加载、切分、检索、重排、引用回答和评估，用至少 20 条测试集验证质量。',
  },
  {
    title: 'Dify + RAGFlow 法律知识助手',
    articleCount: '3 篇',
    standard: '完成知识库配置、工作流编排、引用回答、密钥与日志，跑通真实法律问答场景。',
  },
  {
    title: '简历评估与面试题生成工作流',
    articleCount: '2 篇',
    standard: '完成简历输入、结构化抽取、岗位匹配和面试题生成，覆盖至少 3 个岗位模板。',
  },
  {
    title: '音频转文字与内容整理工作流',
    articleCount: '2 篇',
    standard: '完成音频输入、ASR、摘要和结构化输出，处理至少 3 种音频样本。',
  },
];

export const upcomingLessons = [
  ['2026-07-09', '自定义 Dataset：怎样封装自己的训练数据', '阶段四：PyTorch 深度学习基础'],
  ['2026-07-12', 'DataLoader 进阶：batch、shuffle 与并行加载', '阶段四：PyTorch 深度学习基础'],
  ['2026-07-14', 'nn.Module 详解：模型为什么要继承这个类', '阶段四：PyTorch 深度学习基础'],
] as const;

export function getLessonSortKey(label: string | number | undefined) {
  if (label === undefined) return Number.POSITIVE_INFINITY;

  const match = String(label).match(/^(\d+)([a-z])?$/i);
  if (!match) return Number.POSITIVE_INFINITY;

  const base = Number(match[1]);
  const suffixOffset = match[2] ? (match[2].toLowerCase().charCodeAt(0) - 96) / 10 : 0;
  return base + suffixOffset;
}

export function getStageLessonRange(stage: LearningStage) {
  const labels = stage.postIds.map((_, index) => String(stage.startLesson + index));
  return `${labels[0]}-${labels[labels.length - 1]}`;
}

export function getPostPlacement(postId: string) {
  const section = contentSections.find((item) => item.postIds.includes(postId));
  const stage = learningStages.find((item) => item.postIds.includes(postId));
  const lessonIndex = stage?.postIds.indexOf(postId) ?? -1;
  const globalLessonNumber = stage && lessonIndex >= 0 ? stage.startLesson + lessonIndex : undefined;
  const lessonLabel = globalLessonNumber !== undefined ? String(globalLessonNumber) : undefined;
  const lessonSortKey = getLessonSortKey(lessonLabel ?? globalLessonNumber);

  return {
    section,
    stage,
    lessonNumber: stage && lessonIndex >= 0 ? lessonIndex + 1 : undefined,
    globalLessonNumber,
    lessonLabel,
    lessonSortKey,
  };
}
