---
title: CrossEntropyLoss 详解：分类任务为什么常用它
description: CrossEntropyLoss 常用于分类任务，它关注的不只是模型有没有猜对，还关注模型对正确类别有多自信。
cover: /images/covers/cross-entropy-loss.png
coverAlt: 神经网络笔记旁边的屏幕显示柱状图和曲线，用来表示分类概率和误差。
pubDate: 2026-06-17T15:30:00+08:00
tags: [AI基础, 深度学习, CrossEntropyLoss]
---

做分类任务时，经常会遇到 `CrossEntropyLoss`。

比如图片分类、文本分类、情感分析，只要模型要从多个类别里选一个答案，它就很可能会出现。

它为什么这么常用？

因为分类任务里，我们关心的不只是“猜没猜对”，还关心模型对正确答案有多自信。

## 分类模型输出的是什么

假设我们有一个三分类任务：猫、狗、鸟。

模型最后可能会输出三个分数：

```text
猫：2.1
狗：0.3
鸟：-1.2
```

这些分数还不是概率，它们通常叫 logits。

我们可以用 `Softmax` 把它们转换成概率：

```text
猫：0.82
狗：0.15
鸟：0.03
```

如果真实答案是猫，那么这个预测就比较好，因为模型给猫的概率最高。

## CrossEntropyLoss 关注什么

CrossEntropyLoss 会重点看正确类别的概率。

如果正确类别的概率很高，loss 就小；如果正确类别的概率很低，loss 就大。

比如真实答案是猫：

- 模型给猫 0.9，loss 很小
- 模型给猫 0.5，loss 变大
- 模型给猫 0.1，loss 会很大

这很符合直觉。

模型不仅要选对，还要对正确答案有足够信心。

## 为什么不能只看准确率

假设两个模型都预测对了。

模型 A 给正确类别的概率是 `0.51`。

模型 B 给正确类别的概率是 `0.95`。

从准确率看，它们都对了；但从训练角度看，模型 B 显然更好。

CrossEntropyLoss 就能区分这种差别。

它会鼓励模型把更多概率分给正确类别，而不是只要勉强猜对就行。

## PyTorch 里怎么用

在 PyTorch 里，`CrossEntropyLoss` 通常这样用：

```python
import torch
from torch import nn

loss_fn = nn.CrossEntropyLoss()

logits = torch.tensor([[2.1, 0.3, -1.2]])
target = torch.tensor([0])

loss = loss_fn(logits, target)
```

这里有一个很重要的点：

`CrossEntropyLoss` 接收的是 logits，不需要你提前手动做 Softmax。

因为 PyTorch 的 `CrossEntropyLoss` 内部已经包含了 `LogSoftmax` 和负对数似然损失。

如果你先手动 Softmax，再传进去，反而可能造成数值问题。

## 标签应该长什么样

对于多分类任务，target 通常是类别索引。

比如：

```text
0 表示猫
1 表示狗
2 表示鸟
```

如果一批数据有 4 个样本，标签可能是：

```python
target = torch.tensor([0, 2, 1, 0])
```

这表示第 1 个和第 4 个样本是猫，第 2 个是鸟，第 3 个是狗。

## 小结

CrossEntropyLoss 很适合分类任务，因为它能衡量模型对正确类别的信心。

记住三个关键点：

1. 它常用于分类任务。
2. PyTorch 里通常直接传 logits。
3. target 通常是类别索引，而不是 one-hot。

理解了这些，再看分类模型训练代码，就不会被 loss 那一行卡住。
