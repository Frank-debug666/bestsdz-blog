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
    postIds: ['what-is-tensor', 'pytorch-linear-layer', 'pytorch-dataloader', 'pytorch-training-flow'],
  },
  {
    id: 'projects',
    title: '项目实战',
    description: '用真实项目串起数据、模型、接口和复盘。',
    level: '项目实战',
    postIds: ['spam-sms-project-retrospective', 'rf-text-classification-system'],
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
    postIds: ['what-is-tensor', 'pytorch-linear-layer', 'pytorch-dataloader', 'pytorch-training-flow'],
  },
  {
    id: 'practice',
    number: '04',
    title: '进入真实项目',
    description: '从文本分类项目开始，理解模型之外的数据、接口、前端和复盘。',
    level: '项目实战',
    postIds: ['spam-sms-project-retrospective', 'rf-text-classification-system'],
  },
];

export const upcomingLessons = [
  ['2026-06-23', '自动微分与计算图：loss.backward() 为什么能算梯度', 'PyTorch 入门'],
  ['2026-06-25', 'Shape 为什么是深度学习最重要的数据契约', 'PyTorch 入门'],
  ['2026-06-28', 'Dataset 是什么？如何封装自己的训练数据', 'PyTorch 入门'],
  ['2026-06-30', 'SGD 优化器：最基础的参数更新方法', '深度学习原理'],
  ['2026-07-02', 'Adam 和 AdamW 为什么常用', '深度学习原理'],
  ['2026-07-05', '学习率决定了什么？太大和太小会怎样', '深度学习原理'],
  ['2026-07-07', '正则化、Dropout 与 Early Stopping', '深度学习原理'],
  ['2026-07-09', '训练、验证、测试和推理的区别', 'PyTorch 入门'],
  ['2026-07-12', '模型保存与加载：state_dict 详解', 'PyTorch 入门'],
  ['2026-07-14', 'PyTorch GPU/CUDA 训练完整流程', 'PyTorch 入门'],
  ['2026-07-16', '怎样监控 loss、accuracy 和学习率', 'PyTorch 入门'],
  ['2026-07-19', '从零搭建一个简单神经网络分类器', '项目实战'],
  ['2026-07-21', '手机价格分类项目：从 CSV 到预测结果', '项目实战'],
  ['2026-07-23', 'CIFAR-10 图像分类：第一个 CNN 项目', '项目实战'],
  ['2026-07-26', 'RNN 怎样处理有顺序的数据', '大模型与应用'],
  ['2026-07-28', 'Attention 机制：模型怎样找到重点', '大模型与应用'],
  ['2026-07-30', 'Transformer 从输入到输出的完整结构', '大模型与应用'],
  ['2026-08-02', '调用大模型 API：普通输出与流式输出', '大模型与应用'],
  ['2026-08-04', 'RAG 与工具调用：让模型连接自己的知识和能力', '大模型与应用'],
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
