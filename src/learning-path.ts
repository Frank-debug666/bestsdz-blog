export type LearningLevel = '零基础' | '初级' | '进阶' | '项目实战';

export interface ContentSection {
  id: string;
  title: string;
  description: string;
  level: LearningLevel | '补充' | '持续更新';
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

export interface SupplementalLesson {
  id: string;
  label: string;
  title: string;
  description: string;
  relatedLesson: string;
  stageId: string;
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
    id: 'supplemental',
    title: '补充内容',
    description: '不占用主线编号，但用于展开某个环节的细节、总览或实战补充。',
    level: '补充',
    postIds: [
      'gridsearchcv-parameter-tuning',
      'sklearn-pipeline-practice',
      'chinese-text-classification-project-flow',
      'text-classification-pipeline-full-flow',
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
    id: 'start',
    number: '01',
    title: 'AI 与机器学习基础',
    description: '从什么是 AI 开始，理解机器学习任务、数据、指标以及模型为什么会学偏。',
    positioning: '这是整条路线的地基。先不急着写模型，先把 AI、机器学习、数据、任务和评价指标这些地图坐标摆正。',
    outcome: '能用自己的话解释 AI、机器学习、分类、回归、数据集划分和过拟合，并判断一个入门项目到底在解决什么任务。',
    readingMode: '零基础必读，建议按顺序读完。',
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
    ],
  },
  {
    id: 'principles',
    number: '02',
    title: '深度学习原理入门',
    description: '把神经网络、激活函数、损失函数、梯度下降、交叉熵和反向传播连成一条主线。',
    positioning: '这一阶段负责建立“模型为什么能学”的直觉。先理解神经网络、误差和参数更新，再进入 PyTorch 才不会只是在抄 API。',
    outcome: '能讲清神经网络、激活函数、损失函数、梯度下降、交叉熵和反向传播之间的关系。',
    readingMode: '想理解原理的人必读；只想先跑项目的人也建议至少读完第 9、11、12、14 课。',
    status: '已完成',
    level: '初级',
    startLesson: 9,
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
    number: '03',
    title: 'PyTorch 入门训练主线',
    description: '对应前 20 篇中的 PyTorch 入门内容，先跑通 Tensor、Linear、DataLoader 和完整训练流程。',
    positioning: '把前面抽象的概念放进代码里。这里不追求写复杂模型，只追求把 Tensor、层、数据加载和训练循环跑通。',
    outcome: '能读懂一个最小 PyTorch 训练脚本，知道数据如何进入模型、损失如何计算、参数如何更新。',
    readingMode: '准备写代码时必读；读完可以先做一个最小训练实验。',
    status: '已完成',
    level: '初级',
    startLesson: 15,
    postIds: [
      'what-is-tensor',
      'pytorch-linear-layer',
      'pytorch-dataloader',
      'pytorch-training-flow',
    ],
  },
  {
    id: 'first-projects',
    number: '04',
    title: '前 20 篇项目复盘',
    description: '通过中文文本分类项目复盘，先看一个模型项目从训练脚本到 API 和前端的大概轮廓。',
    positioning: '这是端到端体验，不是逐环节深挖。先让读者看到一个项目完整跑起来，后面再拆开讲每个环节为什么这样做。',
    outcome: '能描述一个中文文本分类项目从数据、训练、保存、API 到前端的大致链路。',
    readingMode: '项目感优先，适合想先看到结果的人；细节会在后续阶段逐步补齐。',
    status: '已完成',
    level: '项目实战',
    startLesson: 19,
    postIds: [
      'spam-sms-project-retrospective',
      'rf-text-classification-system',
    ],
  },
  {
    id: 'traditional-ml',
    number: '05',
    title: '传统机器学习基础（21-34）',
    description: '补齐文本分类项目背后的数据处理、算法、评估和模型选择知识。',
    positioning: '前面直接跳进了神经网络和 PyTorch，现在退一步，用更简单的模型把“数据 → 训练 → 评估 → 选择”主线走通。这是回顾加深，不是突然倒车。',
    outcome: '能拿到一份结构化数据，独立完成清洗、特征工程、建模、评估、模型选择和保存。',
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
    number: '06',
    title: '文本分类项目（35-42）',
    description: '重新拆解中文文本分类链路，从编码清洗、分词、向量化、评估、保存一路做到演示页面。',
    positioning: '第 19-20 课是端到端体验，本阶段是逐环节吃透。不是重讲，而是把中文文本分类的每个关键步骤拆开、讲透、能复用。',
    outcome: '能从一份原始中文文本出发，完成清洗、分词、向量化、训练、评估、保存和演示页面。',
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
    number: '07',
    title: 'PyTorch 深度学习基础（43-44）',
    description: '在前 20 篇 PyTorch 入门上继续深化，补齐 Tensor 进阶、自动微分、计算图和后续训练诊断。',
    positioning: '这一阶段开始补真实训练里的硬功夫：dtype、device、shape、计算图、优化器和训练排错。它决定你能不能独立读懂训练脚本。',
    outcome: '能独立搭建 PyTorch 训练脚本，正确处理 Shape、device、梯度清空、优化器选择和学习率策略。',
    readingMode: '当前更新主线，建议跟更；每篇都要配合代码自检。',
    status: '更新中',
    level: '初级',
    startLesson: 43,
    postIds: [
      'pytorch-tensor-dtype-device-indexing',
      'pytorch-autograd-requires-grad-backward',
    ],
  },
];

export const futureStages: FutureStage[] = [
  {
    number: '07 续',
    range: '45-58',
    title: 'PyTorch 深度学习基础后续',
    description: '继续补齐计算图、Shape、Dataset、优化器、GPU 训练、正则化和训练诊断。',
    outcome: '能独立搭建 PyTorch 训练脚本，并根据 loss、accuracy 和梯度状态诊断常见训练问题。',
    status: '预告',
    topics: ['计算图', 'Shape', 'Dataset/DataLoader', '优化器', '训练诊断'],
  },
  {
    number: '08',
    range: '59-68',
    title: '深度学习项目',
    description: '通过回归、二维分类、表格分类和图像分类项目，把 Dataset、模型、损失、优化器、评估和推理串起来。',
    outcome: '能独立完成一个完整深度学习项目，从数据到推理全流程，并整理出可复用的项目目录结构。',
    status: '预告',
    topics: ['回归项目', '二维分类', '表格分类', 'CNN', '项目模板'],
  },
  {
    number: '09',
    range: '69-78',
    title: 'NLP 与序列模型',
    description: '从文本编号进入 Embedding、FastText、RNN、LSTM 和文本生成，先理解序列模型的能力与局限。',
    outcome: '能把中文文本处理成序列数据，用 FastText/RNN/LSTM 完成分类或字符级生成。',
    status: '预告',
    topics: ['Token 与词表', 'Padding 与 Mask', 'Embedding', 'RNN/LSTM'],
  },
  {
    number: '10',
    range: '79-90',
    title: 'Transformer 与 BERT',
    description: '放慢 Attention 推导过程，从 RNN 的局限进入 Self-Attention、Transformer Encoder 和 BERT 分类。',
    outcome: '能讲清 Self-Attention 的计算流程，并用 BERT 完成文本分类训练和推理。',
    status: '预告',
    topics: ['QKV', 'Self-Attention', 'Position Encoding', 'BERT'],
  },
  {
    number: '11',
    range: '91-100',
    title: '大模型开发',
    description: '从安全调用 API 开始，逐步掌握提示词、结构化输出、Few-shot、ReAct 和工具调用。',
    outcome: '能写出稳定提示词模板，让模型按 JSON 返回结果，并实现一个能调用外部工具的对话助手。',
    status: '预告',
    topics: ['模型 API', '流式输出', '结构化输出', 'Tool Calling'],
  },
  {
    number: '12',
    range: '101-110',
    title: 'RAG 与知识库',
    description: '掌握从文档进入知识库到检索、重排、引用回答和评估的完整流程。',
    outcome: '能从 PDF/Markdown 出发完成切分、向量化、检索、重排和带引用回答，并用测试集评估质量。',
    status: '预告',
    topics: ['Chunk', 'Embedding', '向量数据库', 'RAG 评估'],
  },
  {
    number: '13',
    range: '111-116',
    title: 'Dify / RAGFlow',
    description: '围绕 AI 应用工程问题拆解工具，不写成按钮说明，而是解释工作流如何解决真实问题。',
    outcome: '能设计 Dify 工作流，处理变量流和节点依赖，并配置知识检索减少无依据回答。',
    status: '预告',
    topics: ['工作流', '变量流', '知识检索', '权限与日志'],
  },
  {
    number: '14',
    range: '117-125',
    title: '部署与模型优化',
    description: '把模型从本地脚本变成 API 服务，再理解量化、剪枝、蒸馏的速度、显存和成本取舍。',
    outcome: '能把模型打包成 Docker API 服务，并根据设备和业务目标选择模型压缩方案。',
    status: '预告',
    topics: ['Streamlit/Flask', 'Docker', '量化', '蒸馏'],
  },
  {
    number: '15',
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
  ['2026-09-22', '计算图与梯度累积：为什么训练前必须清空梯度', 'PyTorch 深度学习基础'],
  ['2026-09-29', 'Shape 是深度学习最重要的数据契约', 'PyTorch 深度学习基础'],
  ['2026-10-06', 'reshape、view、transpose 和广播机制怎么选', 'PyTorch 深度学习基础'],
] as const;

export const supplementalLessons: SupplementalLesson[] = [
  {
    id: 'gridsearchcv-parameter-tuning',
    label: '34a',
    title: 'GridSearchCV 调参补充',
    description: '把第 34 课里的调参部分单独展开，适合已经理解交叉验证后继续练习。',
    relatedLesson: '34',
    stageId: 'traditional-ml',
  },
  {
    id: 'sklearn-pipeline-practice',
    label: '34b',
    title: 'sklearn Pipeline 补充',
    description: '把第 34 课里的 Pipeline 思路单独落到代码，避免预处理和模型训练割裂。',
    relatedLesson: '34',
    stageId: 'traditional-ml',
  },
  {
    id: 'chinese-text-classification-project-flow',
    label: '35a',
    title: '中文文本分类项目总览补充',
    description: '作为第 35-42 课的项目导览，帮助先看清数据流，再进入逐环节学习。',
    relatedLesson: '35-42',
    stageId: 'text-classification',
  },
  {
    id: 'text-classification-pipeline-full-flow',
    label: '41a',
    title: '文本分类 Pipeline 全流程补充',
    description: '承接第 41 课的模型保存与复用，把预处理、模型和预测封装成一条流水线。',
    relatedLesson: '41',
    stageId: 'text-classification',
  },
];

const supplementalLessonById = new Map(supplementalLessons.map((lesson) => [lesson.id, lesson]));

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
  const supplementalLesson = supplementalLessonById.get(postId);
  const lessonIndex = stage?.postIds.indexOf(postId) ?? -1;
  const globalLessonNumber = stage && lessonIndex >= 0 ? stage.startLesson + lessonIndex : undefined;
  const lessonLabel = supplementalLesson?.label ?? (globalLessonNumber !== undefined ? String(globalLessonNumber) : undefined);
  const lessonSortKey = getLessonSortKey(lessonLabel ?? globalLessonNumber);

  return {
    section,
    stage,
    lessonNumber: stage && lessonIndex >= 0 ? lessonIndex + 1 : undefined,
    globalLessonNumber,
    lessonLabel,
    lessonSortKey,
    supplementalLesson,
  };
}
