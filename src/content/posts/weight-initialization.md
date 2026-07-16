---
title: 权重、偏置和参数初始化会怎样影响训练
description: 把所有权重初始化成 0，模型直接学不动。初始化成太大的随机数，梯度爆炸。初始化是训练的起跑线，起跑线错了后面全白费。这篇讲清为什么初始化重要、常见方法怎么选。
cover: /images/covers/weight-initialization-video.jpg
coverAlt: 第 51 课权重初始化视频封面，展示 0 初始化、Xavier、Kaiming 与梯度稳定性。
pubDate: 2026-07-16T09:00:00+08:00
tags: [PyTorch, 参数初始化, 权重初始化, Xavier, Kaiming, 梯度稳定性]
---

你训练一个模型，loss 一直不降。换了优化器、调了学习率，都没用。最后发现——权重初始化全设成了 0。

这不是段子。初始化是训练的起跑线，起跑线错了，优化器再好也跑不动。这一篇讲清楚为什么初始化这么重要，以及实战中该用什么。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/weight-initialization-video.jpg" aria-label="第 51 课：权重初始化">
    <source src="/videos/lesson-51-weight-initialization.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 51 课视频 - 权重、偏置和参数初始化会怎样影响训练</figcaption>
</figure>

---

## 概念回顾

上一篇我们学了 nn.Module，知道模型参数会被自动注册。这些参数在创建时会有一个初始值。第 45 篇讲过计算图和梯度——梯度依赖参数的当前值来反向传播。如果所有参数的初始值都一样，梯度也会一样，模型就学不动。第 52 篇我们会讲优化器怎么更新参数，但更新之前，参数得有个合理的起点。

---

## 一句话解释

> 初始化给模型参数一个起点。好的起点让训练快速收敛，坏的起点让梯度消失或爆炸，模型直接学废。

---

## 为什么不能全初始化为 0

先看一个实验：

```python
import torch
import torch.nn as nn

# 全 0 初始化
model = nn.Sequential(nn.Linear(10, 5), nn.ReLU(), nn.Linear(5, 2))
for m in model.modules():
    if isinstance(m, nn.Linear):
        nn.init.zeros_(m.weight)
        nn.init.zeros_(m.bias)

x = torch.randn(4, 10)
y = model(x)
print(y)
# tensor([[0., 0.],
#         [0., 0.],
#         [0., 0.],
#         [0., 0.]])
```

所有输出都是 0。为什么？

**对称性问题**：如果同一层的所有神经元权重相同，它们接收相同的输入、算出相同的输出、得到相同的梯度、做相同的更新。不管训练多久，这些神经元永远一样——等于只有一个神经元。这叫"对称性未被打破"。

**所以初始化的核心目的**：打破对称性，让每个神经元有不同的起点，各自学不同的特征。

---

## PyTorch 的默认初始化

好消息是，`nn.Linear` 等层默认就不是 0 初始化：

```python
layer = nn.Linear(10, 5)
print(layer.weight)
# tensor([[...随机数...]])
# 每个权重都不一样，对称性已被打破
```

PyTorch 的 `nn.Linear` 默认用 **Kaiming 均匀分布**（一种 Xavier 的变体）。大多数情况你不用手动初始化——默认值就够用。

但了解常见初始化方法，遇到训练问题时才知道怎么调。

---

## 常见初始化方法

### 1. 随机正态/均匀分布

最朴素的方法：从正态分布或均匀分布里随机采样。

```python
nn.init.normal_(layer.weight, mean=0.0, std=0.01)
nn.init.uniform_(layer.weight, a=-0.1, b=0.1)
```

**问题**：std 太小，深层网络梯度消失；std 太大，梯度爆炸。需要根据层的输入输出维度调整。

### 2. Xavier 初始化（Glorot）

核心思想：让每一层的输出方差和输入方差一致，避免信号在前向传播中放大或缩小。

```python
# Xavier 正态
nn.init.xavier_normal_(layer.weight)

# Xavier 均匀
nn.init.xavier_uniform_(layer.weight)
```

公式（正态版）：$W \sim N(0, \frac{2}{n_{in} + n_{out}})$

其中 $n_{in}$ 是输入维度，$n_{out}$ 是输出维度。

**适用场景**：搭配 Sigmoid、Tanh 等饱和激活函数。

### 3. Kaiming 初始化（He）

Xavier 的改进版，专门为 ReLU 设计。ReLU 会把负数变成 0，相当于丢掉一半信号，所以方差要放大一倍补偿。

```python
# Kaiming 正态
nn.init.kaiming_normal_(layer.weight, mode='fan_in', nonlinearity='relu')
```

公式（正态版）：$W \sim N(0, \frac{2}{n_{in}})$

**适用场景**：搭配 ReLU、LeakyReLU 等非饱和激活函数。这也是 PyTorch 的默认初始化。

### 4. 偏置初始化

偏置通常初始化为 0，或者一个小的正数。

```python
nn.init.zeros_(layer.bias)              # 全 0（默认）
nn.init.constant_(layer.bias, 0.01)     # 小正数
```

偏置设 0 不会有对称性问题（因为权重已经打破对称了）。

---

## 方法选择速查表

| 激活函数 | 推荐初始化 | API |
|---|---|---|
| ReLU / LeakyReLU | Kaiming | `nn.init.kaiming_normal_` |
| Sigmoid / Tanh | Xavier | `nn.init.xavier_normal_` |
| GELU（Transformer） | Xavier 或 Kaiming | `nn.init.xavier_normal_` |
| 默认情况 | 不用手动设 | PyTorch 自动用 Kaiming 变体 |

---

## 手动初始化的完整写法

```python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, in_features, hidden, num_classes):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden)
        self.fc2 = nn.Linear(hidden, num_classes)
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, nonlinearity='relu')
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)
```

`self.modules()` 递归遍历所有子模块，适合统一初始化。

---

## 梯度消失和梯度爆炸

初始化不当会导致两个极端：

### 梯度消失

权重太小 → 前向输出小 → 反向梯度更小 → 深层几乎学不动。

**症状**：深层网络 loss 不降，浅层权重几乎不变。

**原因**：Sigmoid 的导数最大只有 0.25，多层连乘后梯度指数级衰减。

### 梯度爆炸

权重太大 → 前向输出大 → 反向梯度更大 → 参数飞走。

**症状**：loss 变成 NaN 或 inf。

**缓解**：梯度裁剪 `torch.nn.utils.clip_grad_norm_`（第 44 篇讲过）。

---

## 三条实战经验

1. **大多数情况不用手动初始化**——PyTorch 默认的 Kaiming 够用
2. **遇到深层网络 loss 不降**——检查激活函数和初始化是否匹配（ReLU 配 Kaiming，Tanh 配 Xavier）
3. **遇到 loss 变 NaN**——可能是初始化太大，或学习率太大，加梯度裁剪

---

## 课后练习

**练习 1**：为什么偏置初始化为 0 不会有对称性问题？

**练习 2**：一个 10 层的全连接网络，用 ReLU 激活，默认初始化。如果改用 Sigmoid 激活但不改初始化，可能出现什么问题？

**练习 3**：写代码，把一个模型里所有 Linear 层的权重用 Xavier 初始化，偏置设为 0.1。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：对称性问题的根源是同一层的神经元"接收相同输入、权重相同、输出相同"。偏置不影响这个链条——即使偏置都是 0，只要权重不同（随机初始化打破了对称性），神经元的输出就不同。所以偏置设 0 没问题。

**练习 2**：可能出现梯度消失。PyTorch 默认用 Kaiming 初始化（为 ReLU 设计），而 Sigmoid 的导数最大只有 0.25，多层连乘后梯度指数衰减。应该改用 Xavier 初始化来匹配 Sigmoid。

**练习 3**：
```python
for m in model.modules():
    if isinstance(m, nn.Linear):
        nn.init.xavier_normal_(m.weight)
        nn.init.constant_(m.bias, 0.1)
```
</details>

---

## 核心要点小结

- 全 0 初始化会导致对称性未打破，模型学不动——必须随机初始化
- PyTorch 默认用 Kaiming 变体，大多数情况不用手动改
- ReLU 配 Kaiming，Sigmoid/Tanh 配 Xavier
- 偏置通常设 0，不影响对称性
- 初始化不当导致梯度消失（太小）或爆炸（太大）
- 深层网络 loss 不降，先查初始化和激活函数是否匹配

下一篇开始优化器系列——从最基础的 SGD 和 Momentum 讲起。
