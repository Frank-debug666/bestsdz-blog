export interface ConceptEntry {
  slug: string;
  title: string;
  aliases: string[];
  summary: string;
  plain: string;
  category: 'AI 基础' | '机器学习' | '深度学习' | 'PyTorch' | 'NLP' | '工程实践';
  level: '零基础' | '初级' | '进阶';
  tags: string[];
  relatedPostIds: string[];
}

export const concepts: ConceptEntry[] = [
  {
    slug: 'artificial-intelligence',
    title: '人工智能',
    aliases: ['AI', 'Artificial Intelligence'],
    summary: '让机器完成原本需要人类智能参与的任务，例如识别、预测、生成和决策。',
    plain: '先把 AI 理解成一类能力：机器不是只照规则执行，而是能从数据、规则或反馈中完成更复杂的判断。',
    category: 'AI 基础',
    level: '零基础',
    tags: ['AI基础'],
    relatedPostIds: ['what-is-ai', 'ai-ml-dl-generative-ai'],
  },
  {
    slug: 'machine-learning',
    title: '机器学习',
    aliases: ['ML'],
    summary: '让模型从数据中学习规律，并把学到的规律用到新数据上。',
    plain: '机器学习的重点不是手写所有规则，而是准备数据、定义目标，让模型自己找到可复用的模式。',
    category: '机器学习',
    level: '零基础',
    tags: ['机器学习', 'AI基础'],
    relatedPostIds: ['ai-ml-dl-generative-ai', 'supervised-vs-unsupervised-learning'],
  },
  {
    slug: 'deep-learning',
    title: '深度学习',
    aliases: ['DL'],
    summary: '使用多层神经网络学习数据中的复杂表示，常用于图像、语音、文本和生成任务。',
    plain: '深度学习可以理解为更复杂的机器学习方法，它让模型通过多层变换逐步提取特征。',
    category: '深度学习',
    level: '初级',
    tags: ['深度学习', '神经网络'],
    relatedPostIds: ['what-is-neural-network', 'activation-function'],
  },
  {
    slug: 'supervised-learning',
    title: '监督学习',
    aliases: ['Supervised Learning'],
    summary: '用带答案的数据训练模型，让模型学习输入和目标之间的对应关系。',
    plain: '如果训练数据里有“题目”和“答案”，模型学会以后再给它新题目，它就尝试给出答案。',
    category: '机器学习',
    level: '零基础',
    tags: ['机器学习'],
    relatedPostIds: ['supervised-vs-unsupervised-learning', 'features-labels-datasets'],
  },
  {
    slug: 'classification-regression',
    title: '分类与回归',
    aliases: ['分类', '回归'],
    summary: '分类预测类别，回归预测连续数值，这是监督学习里最常见的两类任务。',
    plain: '判断邮件是不是垃圾邮件是分类，预测房价是多少是回归。',
    category: '机器学习',
    level: '零基础',
    tags: ['机器学习'],
    relatedPostIds: ['classification-vs-regression', 'regression-metrics-mae-mse-rmse-r2'],
  },
  {
    slug: 'train-validation-test',
    title: '训练集、验证集和测试集',
    aliases: ['数据集划分', 'Train Validation Test'],
    summary: '把数据分成训练、调参和最终评估三部分，避免模型只是在记答案。',
    plain: '训练集负责学习，验证集负责选择方案，测试集负责最后验收。',
    category: '机器学习',
    level: '零基础',
    tags: ['数据集', '模型评估'],
    relatedPostIds: ['train-validation-test-sets', 'overfitting-underfitting-data-leakage'],
  },
  {
    slug: 'overfitting',
    title: '过拟合',
    aliases: ['Overfitting', '欠拟合', '数据泄漏'],
    summary: '模型在训练数据上表现很好，但换到新数据上效果变差。',
    plain: '过拟合就像背答案，训练题都会了，但真正考试时不一定会。',
    category: '机器学习',
    level: '零基础',
    tags: ['过拟合', '模型评估'],
    relatedPostIds: ['overfitting-underfitting-data-leakage'],
  },
  {
    slug: 'feature-engineering',
    title: '特征工程',
    aliases: ['Feature Engineering', '特征'],
    summary: '把原始数据整理成模型更容易理解的输入。',
    plain: '模型不能直接理解很多现实信息，特征工程就是把信息翻译成模型能吃进去的格式。',
    category: '机器学习',
    level: '初级',
    tags: ['特征工程', '数据清洗'],
    relatedPostIds: ['what-is-feature-engineering', 'label-encoding-vs-one-hot', 'standardization-vs-normalization'],
  },
  {
    slug: 'neural-network',
    title: '神经网络',
    aliases: ['Neural Network'],
    summary: '由多层线性变换和非线性变换组成的模型，用参数去拟合输入和输出之间的关系。',
    plain: '神经网络不是神秘大脑，它更像一组可以不断调整的函数组合。',
    category: '深度学习',
    level: '初级',
    tags: ['神经网络', '深度学习'],
    relatedPostIds: ['what-is-neural-network', 'activation-function'],
  },
  {
    slug: 'activation-function',
    title: '激活函数',
    aliases: ['Activation Function', 'ReLU', 'Sigmoid'],
    summary: '给神经网络加入非线性能力，让多层网络不只是一个更大的线性模型。',
    plain: '没有激活函数，多层网络叠起来仍然像一条直线；有了它，模型才能表达弯曲复杂的关系。',
    category: '深度学习',
    level: '初级',
    tags: ['激活函数', '深度学习'],
    relatedPostIds: ['activation-function'],
  },
  {
    slug: 'loss-function',
    title: '损失函数',
    aliases: ['Loss Function', '误差函数'],
    summary: '衡量模型预测和真实答案差多少，是训练时优化的目标。',
    plain: '损失函数就是模型的扣分规则，分数越低，说明预测越接近真实答案。',
    category: '深度学习',
    level: '初级',
    tags: ['损失函数', '深度学习'],
    relatedPostIds: ['loss-function', 'cross-entropy-loss'],
  },
  {
    slug: 'cross-entropy-loss',
    title: 'CrossEntropyLoss',
    aliases: ['交叉熵损失', 'Cross Entropy'],
    summary: '分类任务中常用的损失函数，用来衡量模型对正确类别的信心是否足够高。',
    plain: '它不仅看模型有没有猜对，还看模型对正确答案有多自信。',
    category: '深度学习',
    level: '初级',
    tags: ['CrossEntropyLoss', '损失函数'],
    relatedPostIds: ['cross-entropy-loss'],
  },
  {
    slug: 'gradient-descent',
    title: '梯度下降',
    aliases: ['Gradient Descent', '优化器'],
    summary: '根据损失函数的变化方向，一步步调整参数，让模型预测更准。',
    plain: '梯度下降像沿着坡往低处走，目标是找到损失更小的位置。',
    category: '深度学习',
    level: '初级',
    tags: ['梯度下降', '深度学习'],
    relatedPostIds: ['gradient-descent', 'forward-and-backpropagation'],
  },
  {
    slug: 'backpropagation',
    title: '反向传播',
    aliases: ['Backpropagation', 'backward'],
    summary: '把输出端的误差逐层传回去，计算每个参数应该怎样调整。',
    plain: '反向传播负责告诉每个参数：这次错了多少，你该往哪个方向改。',
    category: '深度学习',
    level: '初级',
    tags: ['反向传播', '自动微分'],
    relatedPostIds: ['forward-and-backpropagation', 'pytorch-autograd-requires-grad-backward'],
  },
  {
    slug: 'tensor',
    title: 'Tensor',
    aliases: ['张量'],
    summary: 'PyTorch 中承载数据、参数和中间结果的核心对象。',
    plain: '可以先把 Tensor 理解成支持 GPU、梯度和批量计算的多维数组。',
    category: 'PyTorch',
    level: '初级',
    tags: ['Tensor', 'PyTorch'],
    relatedPostIds: ['what-is-tensor', 'pytorch-autograd-requires-grad-backward'],
  },
  {
    slug: 'dataloader',
    title: 'DataLoader',
    aliases: ['数据加载器'],
    summary: 'PyTorch 中负责按 batch 读取、打乱和并行加载数据的工具。',
    plain: 'DataLoader 负责把数据一批一批喂给模型，训练循环才不会手忙脚乱。',
    category: 'PyTorch',
    level: '初级',
    tags: ['DataLoader', 'PyTorch'],
    relatedPostIds: ['pytorch-dataloader', 'pytorch-training-flow'],
  },
  {
    slug: 'linear-layer',
    title: 'Linear 层',
    aliases: ['全连接层', 'nn.Linear'],
    summary: 'PyTorch 中最基础的线性变换层，把输入特征映射到新的输出空间。',
    plain: 'Linear 层做的是矩阵乘法加偏置，是很多神经网络模块的基础零件。',
    category: 'PyTorch',
    level: '初级',
    tags: ['PyTorch', '神经网络'],
    relatedPostIds: ['pytorch-linear-layer'],
  },
  {
    slug: 'pipeline',
    title: 'Pipeline',
    aliases: ['sklearn Pipeline', '流水线'],
    summary: '把预处理、特征提取和模型训练串成一条可复用流程。',
    plain: 'Pipeline 让项目不再散落成一堆临时代码，也能减少训练和预测时步骤不一致的问题。',
    category: '工程实践',
    level: '初级',
    tags: ['Pipeline', '项目实战'],
    relatedPostIds: ['sklearn-pipeline-practice', 'text-classification-pipeline-full-flow'],
  },
  {
    slug: 'tfidf',
    title: 'TF-IDF',
    aliases: ['TfidfVectorizer'],
    summary: '一种文本特征表示方法，强调在当前文本重要、但在全局不太常见的词。',
    plain: 'TF-IDF 会降低到处都出现的常见词权重，提高更能代表文本主题的词。',
    category: 'NLP',
    level: '初级',
    tags: ['TF-IDF', 'NLP'],
    relatedPostIds: ['tfidf-for-chinese-text', 'tfidf-logistic-regression-baseline'],
  },
  {
    slug: 'confusion-matrix',
    title: '混淆矩阵',
    aliases: ['Confusion Matrix'],
    summary: '展示分类模型把各类样本预测成什么结果，用来分析具体错在哪里。',
    plain: '准确率只给总分，混淆矩阵能告诉你模型到底把哪一类看错成了哪一类。',
    category: '机器学习',
    level: '初级',
    tags: ['混淆矩阵', '模型评估'],
    relatedPostIds: ['classification-metrics', 'text-classification-evaluation-confusion-matrix'],
  },
  {
    slug: 'gridsearchcv',
    title: 'GridSearchCV',
    aliases: ['网格搜索', '调参'],
    summary: '在给定参数组合中系统搜索，并用交叉验证选择表现更好的模型配置。',
    plain: '它不是让模型自动变聪明，而是帮你更规范地试参数、比结果。',
    category: '机器学习',
    level: '初级',
    tags: ['调参', '模型评估'],
    relatedPostIds: ['gridsearchcv-parameter-tuning', 'sklearn-pipeline-practice'],
  },
];

export function getConceptBySlug(slug: string) {
  return concepts.find((concept) => concept.slug === slug);
}

export function getConceptsForPost(postId: string, tags: readonly string[], title = '', limit = 5) {
  const tagSet = new Set(tags);
  const text = title.toLowerCase();

  return concepts
    .map((concept) => {
      const relatedScore = concept.relatedPostIds.includes(postId) ? 6 : 0;
      const tagScore = concept.tags.reduce((score, tag) => score + (tagSet.has(tag) ? 2 : 0), 0);
      const titleScore = [concept.title, ...concept.aliases].some((name) => text.includes(name.toLowerCase())) ? 3 : 0;
      return { concept, score: relatedScore + tagScore + titleScore };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.concept.title.localeCompare(b.concept.title, 'zh-CN'))
    .slice(0, limit)
    .map(({ concept }) => concept);
}
