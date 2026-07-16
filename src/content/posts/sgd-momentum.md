---
title: SGD 与 Momentum：最基础的优化器怎样更新参数
description: 梯度下降是所有优化器的祖宗。SGD 是最朴素的实现，Momentum 加了惯性。搞懂这两个，才能理解后面 Adam 在"智能"什么。
cover: /images/covers/sgd-momentum-video.jpg
coverAlt: 第 52 课 SGD 与 Momentum 视频封面，展示梯度下降、学习率、动量和震荡路径。
pubDate: 2026-07-16T09:20:00+08:00
tags: [PyTorch, SGD, Momentum, 优化器, 梯度下降]
---

第 12 篇你学了梯度下降的概念：算梯度、沿梯度反方向走一步。但概念到代码之间有个问题——"走一步"到底怎么走？步子多大？要不要带惯性？

SGD 和 Momentum 就是回答这些问题的。它们是所有优化器的基石，搞不懂它们，后面 Adam、AdamW 都是在空中楼阁。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/sgd-momentum-video.jpg" aria-label="第 52 课：SGD 与 Momentum">
    <source src="/videos/lesson-52-sgd-momentum.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 52 课视频 - SGD 与 Momentum：最基础的优化器怎样更新参数</figcaption>
</figure>

---

## 概念回顾

第 51 篇我们讲了参数初始化——给参数一个起点。第 45 篇讲了 backward 算梯度。现在梯度有了，起点有了，优化器负责"用梯度更新参数"。第 12 篇的梯度下降公式 $\theta = \theta - \alpha \nabla L$ 就是 SGD 的核心。

---

## 一句话解释

> SGD 是最朴素的梯度下降：拿到梯度、走一步。Momentum 在此基础上加了惯性——把之前的更新方向也考虑进来，减少震荡、加速收敛。

---

## SGD：最朴素的更新

### 公式

$$w_{t+1} = w_t - \alpha \cdot g_t$$

- $w_t$：当前参数
- $\alpha$：学习率（lr）
- $g_t$：当前梯度

每次更新就是"参数减去学习率乘梯度"。方向纯粹由当前梯度决定。

### 代码

```python
import torch

w = torch.tensor([1.0], requires_grad=True)
optimizer = torch.optim.SGD([w], lr=0.1)

# 模拟一步训练
loss = (w * 5 - 10).pow(2)   # 目标：让 w 接近 2
loss.backward()
print(f"梯度: {w.grad}")     # 梯度: tensor([10.])
optimizer.step()
print(f"更新后: {w}")         # 更新后: tensor([0.])
# w = 1.0 - 0.1 * 10.0 = 0.0
```

### 问题：SGD 在"峡谷"里震荡

如果损失函数像一个狭长的山谷——一个方向陡、一个方向平，SGD 会在陡的方向来回震荡，平的方向进展缓慢。

这就是 Momentum 要解决的问题。

---

## Momentum：给梯度加惯性

### 核心思想

想象一个小球滚下山谷。SGD 是"每一步只看当前坡度"，小球在两侧壁上来回弹。Momentum 是"小球有惯性"，把之前的速度也累加进来，震荡被抵消，前进被加速。

### 公式

$$v_t = \beta v_{t-1} + g_t$$

$$w_{t+1} = w_t - \alpha \cdot v_t$$

- $v_t$：动量（累积的速度）
- $\beta$：动量系数，通常 0.9
- $g_t$：当前梯度

动量 $v_t$ 是历史梯度的指数加权平均。如果连续几步梯度方向一致，动量越来越大，走得越快；如果方向来回摆，动量互相抵消，震荡减小。

### 代码

```python
optimizer = torch.optim.SGD(
    model.parameters(),
    lr=0.01,
    momentum=0.9    # 动量系数
)
```

就加了 `momentum=0.9` 这一个参数。

### Momentum 效果

```python
# 没有 momentum
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

# 有 momentum
optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
```

| 特性 | 无 Momentum | 有 Momentum |
|---|---|---|
| 震荡 | 明显 | 减少 |
| 收敛速度 | 慢 | 快 |
| 参数 | 只有 lr | 多一个 beta |

---

## Nesterov Momentum：往前看一步

Momentum 的变体，"先按惯性走一步，再在走到的位置算梯度"。

$$v_t = \beta v_{t-1} + \nabla L(w_t - \alpha \beta v_{t-1})$$

```python
optimizer = torch.optim.SGD(
    model.parameters(),
    lr=0.01,
    momentum=0.9,
    nesterov=True
)
```

理论上比普通 Momentum 更快收敛，实际差异不大。知道有这个选项就行。

---

## SGD API 参数详解

```python
torch.optim.SGD(
    params,              # 模型参数
    lr=0.01,             # 学习率
    momentum=0,          # 动量系数，0.9 常用
    weight_decay=0,      # 权重衰减（L2 正则化）
    dampening=0,         # 动量阻尼，一般不改
    nesterov=False       # 是否用 Nesterov 动量
)
```

| 参数 | 常用值 | 作用 |
|---|---|---|
| `lr` | 0.01 / 0.1 | 步子大小 |
| `momentum` | 0.9 | 惯性大小 |
| `weight_decay` | 1e-4 | 限制参数过大，防过拟合 |
| `nesterov` | True/False | 往前看一步 |

---

## 适用场景

| 场景 | 推荐 |
|---|---|
| CNN 图像分类（ResNet 等） | SGD + Momentum，学习率调得好能超过 Adam |
| 入门理解优化器 | SGD，最直观 |
| 快速跑通实验 | Adam 更快（下篇讲） |
| Transformer 微调 | 不优先用 SGD |

很多人以为 Adam 一定比 SGD 好——其实在图像分类领域，SGD + Momentum + 合理学习率策略，往往能调出比 Adam 更好的最终精度。代价是需要更多调参经验。

---

## 三个高频错误

### 错误 1：学习率设太大

```python
optimizer = torch.optim.SGD(model.parameters(), lr=1.0)
# loss 直接变 NaN
```

SGD 对学习率比 Adam 敏感。入门从 0.01 开始试。

### 错误 2：用了 momentum 但学习率不调

加了 momentum 后，有效步长变大了（动量累积）。如果之前 lr=0.01 没 momentum 能收敛，加了 momentum=0.9 后可能要降到 0.005。

### 错误 3：weight_decay 和 momentum 的交互

PyTorch 的 SGD 里，weight_decay 是先加到梯度上再算动量。这在数学上不完全等价于"解耦权重衰减"——这也是后来 AdamW 出现的原因（第 54 篇会讲）。

---

## 课后练习

**练习 1**：SGD 没加 Momentum 时，连续 3 步梯度分别是 +1、-1、+1，最终更新方向是什么？加了 Momentum（β=0.9）呢？

**练习 2**：为什么 Momentum 能减少震荡？用一句话解释。

**练习 3**：下面配置训练 ResNet，loss 降不下去，可能是什么原因？

```python
optimizer = torch.optim.SGD(model.parameters(), lr=0.001, momentum=0)
```

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
- 无 Momentum：每步独立，方向分别是 -1、+1、-1（反方向），来回震荡。
- 有 Momentum：v1=0.9*0+1=1，v2=0.9*1-1=-0.1，v3=0.9*(-0.1)+1=0.91。第三步动量 0.91，接近 +1 方向。震荡被动量平滑掉了，前进方向更稳定。

**练习 2**：Momentum 是历史梯度的加权平均。震荡方向的梯度正负交替，加权后互相抵消；前进方向的梯度同号，加权后累加放大。所以震荡被抑制、前进被加速。

**练习 3**：两个问题。① lr=0.001 对 SGD 来说太小了，ResNet 训练通常用 0.1 起步。② momentum=0 没加动量，收敛慢。建议改为 `lr=0.1, momentum=0.9`，配合学习率衰减。
</details>

---

## 核心要点小结

- SGD 是最朴素的梯度下降：参数减去学习率乘梯度
- Momentum 加了惯性（历史梯度的加权平均），减少震荡、加速收敛
- 动量系数通常 0.9，加了 momentum 后可能要降学习率
- SGD + Momentum 在图像分类任务上依然是首选
- SGD 对学习率比 Adam 敏感，入门从 lr=0.01 开始试

下一篇讲自适应学习率的起点——AdaGrad 和 RMSProp 怎么让每个参数有"自己的步子大小"。
$\gamma=0.9$
- Nesterov 先按动量走一步再看梯度，收敛稍快
- SGD+Momentum 训练 CNN 泛化好，是 ResNet 等图像模型的首选
- lr 从 0.01 开始，momentum 用 0.9，别乱调

下一篇讲自适应学习率优化器——AdaGrad 和 RMSProp，让每个参数有自己专属的学习率。
