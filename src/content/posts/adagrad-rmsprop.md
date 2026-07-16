---
title: AdaGrad 与 RMSProp：学习率如何自动调整
description: SGD 给所有参数同一个学习率。但有些参数变化剧烈、有些几乎不动，统一步长不合理。AdaGrad 和 RMSProp 让每个参数有自己的自适应学习率。
cover: /images/covers/adagrad-rmsprop-video.jpg
coverAlt: 第 53 课 AdaGrad 与 RMSProp 视频封面，展示自适应学习率和梯度平方累计。
pubDate: 2026-07-16T09:40:00+08:00
tags: [PyTorch, AdaGrad, RMSProp, 自适应学习率, 优化器]
---

上一篇的 SGD 给所有参数用同一个学习率。但仔细想想——模型里有些参数对应的特征经常出现、梯度很大，有些特征很少出现、梯度很小。给它们同一个步子，大的撑死、小的饿死。

AdaGrad 和 RMSProp 就是来解决"每个参数该有不同学习率"这个问题的。它们是 Adam 的直接前身。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/adagrad-rmsprop-video.jpg" aria-label="第 53 课：AdaGrad 与 RMSProp">
    <source src="/videos/lesson-53-adagrad-rmsprop.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 53 课视频 - AdaGrad 与 RMSProp：学习率如何自动调整</figcaption>
</figure>

---

## 概念回顾

上一篇 SGD + Momentum 的核心是"用历史梯度的方向加惯性"。今天换一个角度：不调方向，调步子大小。第 51 篇讲初始化时提到不同参数需要不同对待，优化器也是同理。第 12 篇的梯度下降是所有优化器的共同祖先。

---

## 一句话解释

> AdaGrad 让经常更新的参数学习率自动变小，很少更新的参数保持大学习率。RMSProp 改进了 AdaGrad 学习率只会越来越小的问题，用滑动平均让学习率能升能降。

---

## AdaGrad：累计历史梯度平方

### 核心思想

一个参数如果一直收到大梯度，说明它"学得够多了"，学习率该调小。如果梯度一直很小，说明它"还没学好"，学习率该保持大。

怎么实现？累计历史梯度的平方和，用它来缩放学习率。

### 公式

$$r_t = r_{t-1} + g_t^2$$

$$w_{t+1} = w_t - \frac{\alpha}{\sqrt{r_t} + \epsilon} \cdot g_t$$

- $r_t$：历史梯度平方的累计和
- $\epsilon$：防除零的小常数（1e-8）

分母 $\sqrt{r_t}$ 越大，有效学习率越小。

### 代码

```python
optimizer = torch.optim.Adagrad(
    model.parameters(),
    lr=0.01,
    eps=1e-10
)
```

### AdaGrad 的问题

$r_t$ 只会累加，不会减小。训练后期 $r_t$ 变得很大，所有参数的学习率都趋近于 0，训练提前停滞。

**适用场景**：稀疏特征（如 NLP 词向量），因为稀疏特征出现少、梯度小、$r_t$ 不会很快膨胀。

---

## RMSProp：用滑动平均代替累加和

### 核心改进

RMSProp 把"累加和"换成"滑动平均"——只关注最近的梯度，老梯度逐渐遗忘。这样 $r_t$ 不会一直变大，学习率能升能降。

### 公式

$$r_t = \alpha \cdot r_{t-1} + (1 - \alpha) \cdot g_t^2$$

$$w_{t+1} = w_t - \frac{\eta}{\sqrt{r_t} + \epsilon} \cdot g_t$$

- $\alpha$：衰减系数，通常 0.99
- $r_t$：最近梯度平方的滑动平均

### 代码

```python
optimizer = torch.optim.RMSprop(
    model.parameters(),
    lr=0.001,
    alpha=0.99,
    eps=1e-8
)
```

| 参数 | 常用值 | 作用 |
|---|---|---|
| `lr` | 0.001 | 基础学习率 |
| `alpha` | 0.99 | 滑动平均的衰减系数 |
| `eps` | 1e-8 | 防除零 |
| `momentum` | 0 或 0.9 | 可选加动量 |

### AdaGrad vs RMSProp 对比

| 特性 | AdaGrad | RMSProp |
|---|---|---|
| 累积方式 | 累加和（只增不减） | 滑动平均（能升能降） |
| 学习率趋势 | 只会变小 | 自适应升降 |
| 长期训练 | 提前停滞 | 稳定 |
| 稀疏特征 | 推荐 | 也可以 |
| RNN / 序列 | 一般 | 更推荐 |

---

## 直觉理解：为什么自适应学习率有用

想象一个推荐系统模型，"用户ID"这个特征有几百万个取值，但每个 ID 出现次数很少；"年龄"这个特征取值少、出现频繁。

如果用 SGD 统一学习率：
- 年龄特征梯度大、更新快 → 可能过拟合
- 用户ID特征梯度小、更新慢 → 学不到东西

用自适应优化器：
- 年龄特征 $r_t$ 大 → 学习率自动调小
- 用户ID特征 $r_t$ 小 → 学习率保持大

每个参数都有自己的节奏。

---

## 两个优化器的"分工"

| 优化器 | 擅长 | 不擅长 |
|---|---|---|
| AdaGrad | 稀疏特征、NLP 词向量 | 长期训练（学习率衰减到0） |
| RMSProp | RNN、时间序列、梯度不稳定任务 | Transformer（一般用 Adam） |

---

## 完整训练对比

```python
import torch
import torch.nn as nn

# 简单模型
model = nn.Sequential(nn.Linear(100, 50), nn.ReLU(), nn.Linear(50, 10))

# 三种优化器对比
configs = {
    "SGD": torch.optim.SGD(model.parameters(), lr=0.01),
    "AdaGrad": torch.optim.Adagrad(model.parameters(), lr=0.01),
    "RMSProp": torch.optim.RMSprop(model.parameters(), lr=0.001),
}

# 实际训练时选一个用，不要同时用三个
optimizer = configs["RMSProp"]
```

---

## 三个要点

1. **AdaGrad 开创了"每个参数有自己学习率"的思路**，但累加和导致学习率单调下降
2. **RMSProp 用滑动平均修复了这个问题**，让学习率能适应最近的梯度
3. **两者都是 Adam 的前置知识**——Adam = Momentum（方向） + RMSProp（步长）

---

## 课后练习

**练习 1**：AdaGrad 训练到后期 loss 不降了，最可能的原因是什么？

**练习 2**：RMSProp 的 alpha=0.99 和 alpha=0.5 有什么区别？哪个更关注近期梯度？

**练习 3**：一个 NLP 词向量任务，词表 10 万，大部分词很少出现。选 AdaGrad 还是 RMSProp？为什么？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：AdaGrad 的梯度平方累加和 $r_t$ 一直增大，到后期 $\sqrt{r_t}$ 很大，有效学习率趋近于 0，参数几乎不更新。换 RMSProp 或 Adam 能解决。

**练习 2**：alpha=0.99 表示 99% 看历史、1% 看当前，滑动窗口很长，学习率变化平滑。alpha=0.5 表示一半看历史一半看当前，更关注近期梯度，学习率波动更大。alpha=0.5 更关注近期，但也更不稳定。通常用 0.9-0.99。

**练习 3**：AdaGrad。稀疏特征出现少、梯度小，AdaGrad 的累加机制让这些罕见词保持较大学习率，学得更好。RMSProp 也可以，但 AdaGrad 是为稀疏特征设计的经典选择。如果训练轮数多，RMSProp 更安全（不会学习率归零）。
</details>

---

## 核心要点小结

- AdaGrad 累计梯度平方和，让频繁更新的参数学习率自动变小——适合稀疏特征
- AdaGrad 的问题是学习率单调下降，训练后期可能停滞
- RMSProp 用滑动平均代替累加和，学习率能升能降——适合 RNN 和梯度不稳定任务
- 自适应学习率的核心：每个参数有自己的步子大小
- 这两个是 Adam 的直接前身：Adam = Momentum + RMSProp

下一篇把 Momentum 和自适应学习率合起来——Adam 和 AdamW 为什么成为现代深度学习的默认选择。
