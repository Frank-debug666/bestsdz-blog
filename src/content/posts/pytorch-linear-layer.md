---
title: PyTorch 的 Linear 层详解：全连接层到底做了什么
description: Linear 层本质上是一次线性变换，它把输入特征通过权重矩阵和偏置映射到新的输出空间。
cover: /images/covers/pytorch-linear-layer.png
coverAlt: 神经网络节点图和一条线性映射示意图，表现 PyTorch Linear 层的计算。
pubDate: 2026-06-17T15:00:00+08:00
tags: [PyTorch, Linear, 神经网络]
---

在 PyTorch 里，`nn.Linear` 是最常见的层之一。

它也叫全连接层。很多入门模型、分类器、回归模型都会用到它。

如果你能理解 Linear 层，很多神经网络结构都会变得更容易读。

## Linear 层做了什么

Linear 层本质上做的是一次线性变换：

```text
输出 = 输入 * 权重 + 偏置
```

在 PyTorch 里可以这样写：

```python
from torch import nn

layer = nn.Linear(in_features=4, out_features=2)
```

这表示输入有 4 个特征，输出有 2 个特征。

## in_features 和 out_features

理解 Linear 层，最重要的是理解这两个参数：

- `in_features`：每个样本输入特征的数量
- `out_features`：每个样本输出特征的数量

比如一个样本有 4 个数：

```text
[身高, 体重, 年龄, 运动频率]
```

如果我们想把它映射成 2 个输出，就可以用 `nn.Linear(4, 2)`。

## 输入 shape 应该是什么

Linear 层最常见的输入形状是：

```text
[batch_size, in_features]
```

比如：

```python
import torch
from torch import nn

x = torch.randn(32, 4)
layer = nn.Linear(4, 2)
y = layer(x)

print(y.shape)
```

输出就是：

```text
torch.Size([32, 2])
```

这里 32 个样本被一起送进模型，每个样本从 4 个特征变成 2 个输出。

## Linear 层有参数吗

有。

Linear 层内部会自动创建权重和偏置。

你可以这样看：

```python
print(layer.weight.shape)
print(layer.bias.shape)
```

对于 `nn.Linear(4, 2)`，权重形状通常是 `[2, 4]`，偏置形状是 `[2]`。

这些参数会在训练过程中被优化器更新。

## 为什么它叫全连接

因为输入的每一个特征，都会连接到输出的每一个神经元。

如果输入有 4 个特征，输出有 2 个神经元，那么每个输出都会看到全部 4 个输入。

这就是“全连接”的意思。

## 小结

Linear 层是神经网络里最基础的计算模块之一。

它做的是从一个特征空间到另一个特征空间的线性映射。

刚开始学 PyTorch 时，先把 `in_features`、`out_features` 和输入 shape 搞清楚，就已经解决了一大半困惑。
