# AI 技术博客剩余 20 篇发布日历

当前 10 篇已经作为第一批集中发布。后续 20 篇继续按“每周 3 篇”的节奏推进：周二发技术理解，周四发代码实战，周日发总结或专题梳理。

| 日期 | 星期 | 标题 | 栏目 | 关键词 | 写作重点 |
| --- | --- | --- | --- | --- | --- |
| 2026-06-21 | 周日 | MSELoss 详解：回归任务为什么常用均方误差 | AI 基础 | MSELoss | 用预测房价、预测数值这类例子解释误差平方。 |
| 2026-06-23 | 周二 | SGD 优化器是什么？最基础的参数更新方法 | AI 基础 | SGD | 解释随机梯度下降和 batch 训练之间的关系。 |
| 2026-06-25 | 周四 | Adam 优化器为什么这么常用？原理和直觉版解释 | AI 基础 | Adam Optimizer | 用自适应学习率解释 Adam 的优势。 |
| 2026-06-28 | 周日 | 反向传播到底在做什么？别再只会背公式了 | AI 基础 | 反向传播 | 从“谁该为错误负责”解释梯度如何往前传。 |
| 2026-06-30 | 周二 | Dataset 是什么？为什么训练数据要先封装 | PyTorch 实战 | Dataset | 讲清楚 `__len__` 和 `__getitem__` 的作用。 |
| 2026-07-02 | 周四 | with torch.no_grad 有什么用？验证和推理为什么要关梯度 | PyTorch 实战 | torch.no_grad | 解释省显存、加速和避免记录计算图。 |
| 2026-07-05 | 周日 | PyTorch 怎么用 GPU 训练？从 CPU 到 CUDA 的完整流程 | PyTorch 实战 | CUDA | 讲清楚 `device`、模型迁移和数据迁移。 |
| 2026-07-07 | 周二 | 模型怎么保存和加载？state_dict 一次讲明白 | PyTorch 实战 | state_dict | 区分保存整个模型和只保存参数。 |
| 2026-07-09 | 周四 | 训练过程怎么监控？loss、accuracy、学习率应该怎么看 | PyTorch 实战 | 训练监控 | 建立训练日志和基础可视化意识。 |
| 2026-07-12 | 周日 | 决策边界可视化：怎么真正看懂一个分类模型学到了什么 | PyTorch 实战 | 决策边界 | 用二维分类图解释模型边界。 |
| 2026-07-14 | 周二 | Transformer 是什么？为什么它改变了 NLP | Transformer 专题 | Transformer | 从 RNN 的限制讲到 Transformer 的并行和注意力。 |
| 2026-07-16 | 周四 | Attention 机制是什么？为什么模型开始会看重点 | Transformer 专题 | Attention | 用查询资料时抓重点的直觉解释注意力。 |
| 2026-07-19 | 周日 | Self-Attention 详解：一句话内部的信息怎么交互 | Transformer 专题 | Self-Attention | 解释每个词如何和同一句里的其他词建立关系。 |
| 2026-07-21 | 周二 | Q、K、V 到底是什么？用最直白的方式解释清楚 | Transformer 专题 | QKV | 用“提问、匹配、取信息”的方式讲 QKV。 |
| 2026-07-23 | 周四 | Multi-Head Attention 为什么要多头？不是头越多越玄学 | Transformer 专题 | Multi-Head Attention | 解释多个注意力头学习不同关系。 |
| 2026-07-26 | 周日 | Position Encoding 是什么？Transformer 为什么还需要位置 | Transformer 专题 | Position Encoding | 讲清楚无循环结构下位置信息从哪里来。 |
| 2026-07-28 | 周二 | Encoder 结构详解：输入文本是怎么被编码的 | Transformer 专题 | Encoder | 拆解 Self-Attention、残差连接和前馈网络。 |
| 2026-07-30 | 周四 | Decoder 结构详解：输出文本是怎么一步步生成的 | Transformer 专题 | Decoder | 解释 Masked Attention 和逐步生成。 |
| 2026-08-02 | 周日 | GPT 的工作原理是什么？从 Transformer 到生成模型 | Transformer 专题 | GPT | 讲清楚自回归生成和预测下一个 token。 |
| 2026-08-04 | 周二 | Transformer 学习总结：我终于把这一套串起来了 | Transformer 专题 | Transformer 总结 | 把 Attention、QKV、Encoder、Decoder、GPT 串成整体。 |

执行提醒：

- 每篇文章只聚焦一个关键词，标题尽量包含搜索词。
- 每篇正文至少回答三个问题：它是什么、为什么需要它、代码或训练里怎么用。
- 发布后可以同步精简版到知乎、CSDN、掘金，引导回博客原文。
