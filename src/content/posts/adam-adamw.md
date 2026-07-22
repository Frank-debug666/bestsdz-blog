---
title: "Adam 和 AdamW 为什么成为常用选择"
description: 'Adam 把 Momentum 的"方向惯性"和 RMSProp 的"自适应步长"合体，开箱即用。AdamW 修复了 Adam 权重衰减的耦合 bug，成为 Transformer 的标配。'
cover: /images/covers/adam-adamw-video.jpg
coverAlt: 第 54 课 Adam 与 AdamW 视频封面，展示一阶动量、二阶动量、权重衰减和 Transformer 优化器选择。
pubDate: 2026-07-22T09:00:00+08:00
tags: [PyTorch, Adam, AdamW, 优化器, 权重衰减, Transformer]
---

前面两篇我们学了 SGD + Momentum（方向有惯性）和 AdaGrad/RMSProp（步长自适应）。如果把这两者合起来呢？

这就是 Adam——深度学习里用得最多的优化器。而 AdamW 是它的改进版，修复了一个权重衰减的设计缺陷，成为 BERT、GPT 等 Transformer 模型的标配。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/adam-adamw-video.jpg" aria-label="第 54 课：Adam 与 AdamW">
    <source src="/videos/lesson-54-adam-adamw.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 54 课视频 - Adam 和 AdamW 为什么成为常用选择</figcaption>
</figure>

---

## 概念回顾

第 52 篇 Momentum 用历史梯度的加权平均给更新方向加惯性。第 53 篇 RMSProp 用梯度平方的滑动平均让每个参数有自适应学习率。Adam 把这两者合并：用一阶动量（Momentum）控制方向，用二阶动量（RMSProp）控制步长。第 51 篇讲过权重衰减（L2 正则化），AdamW 要解决的就是权重衰减在 Adam 里的实现问题。

---

## 一句话解释

> Adam = Momentum + RMSProp，既有方向惯性又有自适应步长，开箱即用几乎不用调参。AdamW 修复了 Adam 里权重衰减和梯度更新耦合的问题，更适合 Transformer。

---

## Adam：动量 + 自适应

### 公式

一阶动量（方向）：

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$

二阶动量（步长）：

$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

偏差校正（训练初期修正）：

$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

参数更新：

$$w_{t+1} = w_t - \frac{\alpha}{\sqrt{\hat{v}_t} + \epsilon} \cdot \hat{m}_t$$

不要被公式吓到，核心就两点：
- $m_t$ 记住"最近梯度往哪走"（Momentum 的方向）
- $v_t$ 记住"最近梯度有多大"（RMSProp 的步长）

### 代码

```python
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001,              # 学习率，Adam 常用 1e-3
    betas=(0.9, 0.999),    # (一阶动量系数, 二阶动量系数)
    eps=1e-8,              # 防除零
    weight_decay=0          # 权重衰减
)
```

| 参数 | 常用值 | 含义 |
|---|---|---|
| `lr` | 1e-3 | 学习率 |
| `betas` | (0.9, 0.999) | 一阶/二阶动量系数 |
| `eps` | 1e-8 | 数值稳定 |
| `weight_decay` | 0 或 0.01 | 权重衰减 |

### 偏差校正为什么重要

训练刚开始时，$m_0 = 0$，$v_0 = 0$。前几步的 $m_t$ 和 $v_t$ 都偏小（被初始的 0 拉低了）。偏差校正把它们放大，让前几步的更新步子正常。

```python
# 不加偏差校正的前几步
# m_1 = 0.1 * g_1  （只有 10% 的梯度）
# 校正后 m_1_hat = m_1 / (1 - 0.9) = g_1  （恢复到 100%）
```

---

## AdamW：解耦权重衰减

### Adam 的权重衰减问题

在 Adam 里，`weight_decay` 是加到梯度上的：

```python
# Adam 内部近似这样
g_t = grad + weight_decay * w_t     # 先把衰减加到梯度
m_t = beta1 * m_{t-1} + (1-beta1) * g_t   # 再算动量
```

问题：权重衰减经过了动量平滑，和梯度更新耦合在一起。当梯度很大时，权重衰减的效果被动量放大；梯度小时又被缩小。这不符合 L2 正则化的本意。

### AdamW 的修复

AdamW 把权重衰减和梯度更新**解耦**：

```python
# AdamW 内部近似这样
m_t = beta1 * m_{t-1} + (1-beta1) * grad   # 动量只用真实梯度
v_t = beta2 * v_{t-1} + (1-beta2) * grad^2
w_t = w_t - lr * (m_t / (sqrt(v_t) + eps) + weight_decay * w_t)  # 衰减单独加
```

权重衰减直接作用在参数上，不经过动量。

### 代码

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-4,               # 大模型微调常用更小的 lr
    betas=(0.9, 0.999),
    eps=1e-8,
    weight_decay=0.01       # 解耦的权重衰减
)
```

### Adam vs AdamW 对比

| 特性 | Adam | AdamW |
|---|---|---|
| 权重衰减方式 | 耦合（加到梯度上） | 解耦（直接作用参数） |
| 效果 | 权重衰减被动量干扰 | 权重衰减稳定可控 |
| 大模型表现 | 一般 | 更好 |
| 默认推荐 | 普通任务 | Transformer / BERT / GPT |

一句话：**如果你需要 weight_decay，用 AdamW。不需要 weight_decay，两者等价。**

---

## 适用场景速查

| 场景 | 推荐优化器 | 学习率 |
|---|---|---|
| 普通分类/回归 | Adam | 1e-3 |
| MLP / 入门实验 | Adam | 1e-3 |
| 快速跑通 | Adam | 1e-3 |
| BERT 微调 | AdamW | 1e-5 ~ 2e-5 |
| GPT 类微调 | AdamW | 1e-5 |
| ViT | AdamW | 1e-4 |
| ResNet 图像分类 | SGD+Momentum | 0.1（配合衰减） |

---

## 学习率选择经验

Adam 对学习率不敏感（这也是它流行的原因），但也有范围：

```python
# 普通深度学习
lr=1e-3   # 万金油

# loss 震荡明显
lr=1e-4   # 降一档

# 大模型微调（不能破坏预训练权重）
lr=1e-5   # 很小

# 太大会怎样？
lr=1e-2   # 预训练模型被破坏，效果变差
```

---

## 三个高频错误

### 错误 1：Adam 配 weight_decay

```python
# 技术上能跑，但不是最优
optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=0.01)
```

需要 weight_decay 就用 AdamW，不需要就设 0。不要用 Adam + weight_decay。

### 错误 2：大模型微调学习率太大

```python
# ❌ BERT 微调用 1e-3，预训练权重被破坏
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

# ✅ 大模型微调用 1e-5 到 2e-5
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
```

### 错误 3：保存了模型但没保存优化器状态

Adam 内部维护 $m_t$ 和 $v_t$，如果断点续训不恢复这些状态，等于从头开始且前几步有偏差。

```python
# 保存
torch.save({
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict()    # ✅ 一起存
}, "checkpoint.pth")

# 恢复
ckpt = torch.load("checkpoint.pth")
model.load_state_dict(ckpt["model"])
optimizer.load_state_dict(ckpt["optimizer"])   # ✅ 恢复动量
```

---

## 课后练习

**练习 1**：用一句话解释 Adam 和 AdamW 的区别。

**练习 2**：为什么大模型微调（如 BERT）要用很小的学习率（1e-5）而不是 Adam 默认的 1e-3？

**练习 3**：下面三种配置，哪个最适合 BERT 文本分类微调？

```python
# A
torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
# B
torch.optim.Adam(model.parameters(), lr=0.001)
# C
torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
```

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：Adam 的权重衰减加到梯度上再算动量（耦合），AdamW 把权重衰减直接作用到参数上（解耦），衰减效果更稳定可控。

**练习 2**：大模型的预训练权重已经包含了丰富的语言知识，学习率太大会在几步内把这些权重冲坏，等于浪费了预训练。小学习率只做微调，在预训练基础上小幅调整。这就像修缮一栋已建好的房子——只能小修小补，不能推倒重来。

**练习 3**：选 C。BERT 微调标配是 AdamW + 小学习率 + weight_decay。A 的 SGD 不适合 Transformer。B 的 Adam 没有 weight_decay，且 1e-3 对 BERT 太大。
</details>

---

## 核心要点小结

- Adam = Momentum（方向惯性）+ RMSProp（自适应步长），开箱即用几乎不调参
- betas=(0.9, 0.999) 是默认值，一般不用改
- AdamW 解耦了权重衰减，效果比 Adam + weight_decay 更稳定
- 需要 weight_decay 用 AdamW，不需要用 Adam
- 大模型微调学习率要小（1e-5 级别），否则破坏预训练权重
- 断点续训要保存和恢复 optimizer 的 state_dict（包含动量）

下一篇讲学习率——训练里最敏感的超参数，过大过小都不行，衰减策略怎么选。
