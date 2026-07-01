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
  level: LearningLevel;
  postIds: string[];
}

export interface FutureStage {
  number: string;
  range: string;
  title: string;
  description: string;
  topics: string[];
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
      'model-evaluation-cross-validation',
      'gridsearchcv-parameter-tuning',
      'sklearn-pipeline-practice',
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
      'chinese-text-classification-project-flow',
      'chinese-tokenization-stopwords',
      'tfidf-for-chinese-text',
      'countvectorizer-bag-of-words',
      'tfidf-logistic-regression-baseline',
      'text-classification-evaluation-confusion-matrix',
      'text-classification-pipeline-full-flow',
      'save-load-text-classification-model',
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
    title: '先建立 AI 地图',
    description: '不急着写模型，先弄懂 AI 在解决什么问题，以及机器学习项目的基本规则。',
    level: '零基础',
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
    title: '理解模型怎样学习',
    description: '把神经网络、激活函数、损失和参数更新连成一个完整过程。',
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
    number: '03',
    title: '用 PyTorch 跑通训练',
    description: '认识 Tensor、网络层和数据加载，最后独立读懂完整训练循环。',
    level: '初级',
    postIds: [
      'what-is-tensor',
      'pytorch-linear-layer',
      'pytorch-dataloader',
      'pytorch-training-flow',
      'pytorch-autograd-requires-grad-backward',
    ],
  },
  {
    id: 'practice',
    number: '04',
    title: '进入真实项目',
    description: '从文本分类项目开始，理解模型之外的数据、接口、前端和复盘。',
    level: '项目实战',
    postIds: [
      'spam-sms-project-retrospective',
      'rf-text-classification-system',
      'chinese-text-classification-project-flow',
      'chinese-tokenization-stopwords',
      'tfidf-for-chinese-text',
      'countvectorizer-bag-of-words',
      'tfidf-logistic-regression-baseline',
      'text-classification-evaluation-confusion-matrix',
      'text-classification-pipeline-full-flow',
      'save-load-text-classification-model',
    ],
  },
  {
    id: 'traditional-ml',
    number: '05',
    title: '补齐传统机器学习基础',
    description: '把数据清洗、特征准备和项目流程打牢，再进入线性回归、逻辑回归和树模型。',
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
      'model-evaluation-cross-validation',
      'gridsearchcv-parameter-tuning',
      'sklearn-pipeline-practice',
    ],
  },
];

export const futureStages: FutureStage[] = [
  {
    number: '01',
    range: '21-34',
    title: '传统机器学习基础',
    description: '补齐数据处理、经典算法、模型评估和模型选择，为后面的项目建立可靠基础。',
    topics: ['数据清洗', '特征工程', '回归与分类', '决策树与集成学习'],
  },
  {
    number: '02',
    range: '36-43',
    title: '文本分类项目',
    description: '重新拆解中文文本分类链路，从文本清洗一直做到模型推理和演示页面。',
    topics: ['中文分词', '词袋与 TF-IDF', '模型评估', 'Streamlit'],
  },
  {
    number: '03',
    range: '44-58',
    title: 'PyTorch 深度学习基础',
    description: '深入 Tensor、自动微分、Dataset、优化器和训练诊断，逐步具备独立训练能力。',
    topics: ['自动微分', 'Shape', 'Dataset', '优化器与 GPU'],
  },
  {
    number: '04',
    range: '59-68',
    title: '深度学习项目',
    description: '通过回归、表格分类和图像分类项目，把训练、验证、推理与复盘串起来。',
    topics: ['回归项目', '二维分类', 'CNN', '项目模板'],
  },
  {
    number: '05',
    range: '69-78',
    title: 'NLP 与序列模型',
    description: '从文本编号和 Embedding 出发，进入 FastText、RNN、LSTM 与文本生成。',
    topics: ['Token 与词表', 'Embedding', 'RNN', 'LSTM'],
  },
  {
    number: '06',
    range: '79-90',
    title: 'Transformer 与 BERT',
    description: '放慢 Attention 的推导节奏，再逐层理解 Transformer 和 BERT 文本分类。',
    topics: ['QKV', 'Self-Attention', 'Transformer', 'BERT'],
  },
  {
    number: '07',
    range: '91-100',
    title: '大模型开发',
    description: '从安全调用 API 开始，掌握流式输出、Prompt、结构化输出与工具调用。',
    topics: ['模型 API', '多轮对话', '结构化输出', 'Tool Calling'],
  },
  {
    number: '08',
    range: '101-110',
    title: 'RAG 与知识库',
    description: '完成文档加载、切分、检索、重排、生成和评估的完整知识库链路。',
    topics: ['Chunk', 'Embedding', '混合检索', 'RAG 评估'],
  },
  {
    number: '09',
    range: '111-116',
    title: 'Dify 与 RAGFlow',
    description: '围绕真实应用理解工作流、变量、知识检索、安全与可观测性。',
    topics: ['工作流', '变量流', '知识检索', '权限与日志'],
  },
  {
    number: '10',
    range: '117-125+',
    title: '部署与模型优化',
    description: '把应用正式部署，再理解量化、剪枝、蒸馏，并持续追加综合项目。',
    topics: ['Flask 与 Docker', '服务化', '模型压缩', '综合项目'],
  },
];

export const upcomingLessons = [
  ['2026-09-22', 'PyTorch 计算图是什么？为什么 backward 能自动求梯度', 'PyTorch 深度学习基础'],
  ['2026-09-29', 'Tensor 的 shape 与 view：训练时最容易出错的地方', 'PyTorch 深度学习基础'],
  ['2026-10-06', 'Dataset 与 DataLoader 进阶：把真实数据喂给模型', 'PyTorch 深度学习基础'],
] as const;

export function getPostPlacement(postId: string) {
  const section = contentSections.find((item) => item.postIds.includes(postId));
  const stage = learningStages.find((item) => item.postIds.includes(postId));
  const lessonIndex = stage?.postIds.indexOf(postId) ?? -1;

  return {
    section,
    stage,
    lessonNumber: stage && lessonIndex >= 0 ? lessonIndex + 1 : undefined,
  };
}
