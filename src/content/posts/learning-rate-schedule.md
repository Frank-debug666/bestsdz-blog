---
title: "学习率决定什么：衰减策略与训练曲线"
description: "学习率是训练里最敏感的超参数——太大 loss 爆炸，太小 loss 不动。这篇讲清怎么判断学习率过大过小，以及 StepLR、CosineAnnealing 等衰减策略怎么选。"
cover: /images/covers/learning-rate-schedule-video.jpg
coverAlt: 第 55 课学习率衰减视频封面，展示 loss 曲线、StepLR、CosineAnnealing 和训练阶段。
pubDate: 2026-07-22T09:20:00+08:00
tags: [PyTorch, 学习率, 学习率衰减, StepLR, CosineAnnealing, 训练曲线]
---

你换了优化器、加了正则化、调了 batch_size，loss 还是不理想。最后发现是学习率没调对——太大，loss 在天上飞；太小，loss 趴着不动。

学习率是训练里最敏感的旋钮。这篇讲清怎么判断它大了还是小了，以及训练中后期的衰减策略。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/learning-rate-schedule-video.jpg" aria-label="第 55 课：学习率衰减">
    <source src="/videos/lesson-55-learning-rate-schedule.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 55 课视频 - 学习率决定什么：衰减策略与训练曲线</figcaption>
</figure>

---

## 概念回顾

第 52-54 篇我们讲了 SGD、AdaGrad、RMSProp、Adam 四种优化器，每个都有 `lr` 参数。第 12 篇梯度下降公式 $\theta = \theta - \alpha \nabla L$ 里的 $\alpha$ 就是学习率。今天我们专门讲这个 $\alpha$ 怎么设、怎么变。

---

## 一句话解释

> 学习率控制每次参数更新的步子大小。前期大步快走，后期小步精修——这就是学习率衰减策略的核心逻辑。

---

## 学习率过大 vs 过小：怎么判断

看 loss 曲线是最直接的方法。

| 症状 | 可能原因 | 处理 |
|---|---|---|
| loss 剧烈震荡 | 学习率太大 | 降 10 倍 |
| loss 变 NaN | 学习率太大 | 降 10 倍 + 梯度裁剪 |
| loss 先降后升 | 学习率偏大 | 降 2-5 倍 |
| loss 几乎不动 | 学习率太小 | 升 10 倍 |
| loss 平稳下降 | 合适 | 保持 |

### 经验范围

| 优化器 | 入门起点 | 常用范围 |
|---|---|---|
| SGD | 0.01 | 0.001 ~ 0.1 |
| Adam | 0.001 | 0.0001 ~ 0.01 |
| AdamW（大模型微调） | 0.00002 | 0.00001 ~ 0.0001 |

```python
# 太大
optimizer = torch.optim.Adam(model.parameters(), lr=0.1)    # loss 爆炸

# 合适
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)  # loss 平稳下降

# 太小
optimizer = torch.optim.Adam(model.parameters(), lr=0.00001) # loss 不动
```

---

## 为什么需要衰减

训练分两个阶段：

- **前期**：参数离最优解远，需要大步快走 → 大学习率
- **后期**：参数接近最优解，需要小步精修 → 小学习率

如果全程用大学习率，后期会在最优解附近来回震荡，无法精确收敛。如果全程用小学习率，前期太慢。所以需要**衰减**——前期大、后期小。

---

## 常见衰减策略

### 1. StepLR：等间隔衰减

每隔固定 epoch，学习率乘以一个系数。

```python
from torch.optim.lr_scheduler import StepLR

optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
scheduler = StepLR(optimizer, step_size=10, gamma=0.5)
# 每 10 个 epoch，lr = lr * 0.5

for epoch in range(30):
    train(...)
    scheduler.step()    # 每个 epoch 结束后调用
```

| 参数 | 含义 |
|---|---|
| `step_size` | 每隔多少 epoch 衰减一次 |
| `gamma` | 衰减系数（0.5 表示减半） |

### 2. MultiStepLR：指定里程碑衰减

在指定的 epoch 处衰减。

```python
from torch.optim.lr_scheduler import MultiStepLR

scheduler = MultiStepLR(optimizer, milestones=[50, 130, 200], gamma=0.1)
# 在第 50、130、200 个 epoch 各乘以 0.1
```

适合"我知道大概在哪些节点该降"的场景。

### 3. ExponentialLR：指数衰减

每个 epoch 都衰减一点点。

```python
from torch.optim.lr_scheduler import ExponentialLR

scheduler = ExponentialLR(optimizer, gamma=0.99)
# 每个 epoch: lr = lr * 0.99
```

衰减最平滑，但下降较快。

### 4. CosineAnnealingLR：余弦退火

按余弦曲线平滑下降，前期慢、中期快、后期又慢。

```python
from torch.optim.lr_scheduler import CosineAnnealingLR

scheduler = CosineAnnealingLR(optimizer, T_max=50, eta_min=0)
# T_max 是周期长度，eta_min 是最小学习率
```

**推荐**：CosineAnnealingLR 是现代深度学习最常用的衰减策略，效果通常比 StepLR 好。

---

## 使用模板

```python
import torch
import torch.nn as nn
from torch.optim.lr_scheduler import CosineAnnealingLR

model = nn.Sequential(nn.Linear(100, 50), nn.ReLU(), nn.Linear(50, 10))
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
scheduler = CosineAnnealingLR(optimizer, T_max=50)

for epoch in range(50):
    model.train()
    for x, y in train_loader:
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()

    scheduler.step()   # ⚠️ 放在 epoch 循环里，不是 batch 循环里

    # 打印当前学习率
    current_lr = optimizer.param_groups[0]['lr']
    print(f"Epoch {epoch+1}, lr={current_lr:.6f}, loss={loss.item():.4f}")
```

**关键**：`scheduler.step()` 放在每个 epoch 训练结束后，不是每个 batch 后。

---

## Warmup：大模型训练的特殊策略

大模型训练（如 BERT、GPT）常用 warmup：前几个 epoch 学习率从 0 线性升到目标值，再开始衰减。

为什么？大模型初期参数没稳定，直接用大学习率会破坏初始化。先小步热身，再大步走。

```python
from torch.optim.lr_scheduler import LinearLR, SequentialLR

# Warmup + Cosine 组合
warmup = LinearLR(optimizer, start_factor=0.1, total_iters=5)
cosine = CosineAnnealingLR(optimizer, T_max=45)
scheduler = SequentialLR(optimizer, [warmup, cosine], milestones=[5])
```

入门项目不需要 warmup，但知道大模型训练有这回事。

---

## 三个高频错误

### 错误 1：scheduler.step() 放错位置

```python
# ❌ 放在 batch 循环里，学习率衰减太快
for epoch in range(50):
    for x, y in train_loader:
        ...
        optimizer.step()
        scheduler.step()   # 每个 batch 都调！

# ✅ 放在 epoch 循环里
for epoch in range(50):
    for x, y in train_loader:
        ...
        optimizer.step()
    scheduler.step()       # 每个 epoch 调一次
```

### 错误 2：只调学习率不看 loss 曲线

盲目调 lr 没意义。训练时记录 loss，画出来看趋势。

```python
losses = []
for epoch in range(50):
    for x, y in train_loader:
        ...
        losses.append(loss.item())

import matplotlib.pyplot as plt
plt.plot(losses)
plt.xlabel('step')
plt.ylabel('loss')
plt.show()
```

### 错误 3：学习率衰减太早

前 10 个 epoch loss 还在快速下降，就开始衰减学习率，导致训练提前停滞。一般在前期 loss 平台期再开始衰减。

---

## 课后练习

**练习 1**：StepLR(step_size=10, gamma=0.1)，初始 lr=0.1，第 25 个 epoch 时学习率是多少？

**练习 2**：训练时 loss 先正常下降，到 epoch 30 突然变成 NaN，最可能是什么原因？怎么排查？

**练习 3**：写一个训练配置：Adam 优化器，lr=0.001，前 5 个 epoch warmup，之后用余弦退火到 0，总共 50 个 epoch。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：第 10、20 个 epoch 分别衰减一次。第 25 个 epoch 时已经衰减了 2 次：0.1 → 0.01 → 0.001。学习率是 0.001。

**练习 2**：最可能是学习率偏大，到训练中期梯度累积导致参数飞走。排查：① 检查 loss 曲线看是不是突然飙升。② 加梯度裁剪 `clip_grad_norm_`。③ 降低学习率重试。④ 检查数据有没有异常值（如除以 0）。

**练习 3**：
```python
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
warmup = LinearLR(optimizer, start_factor=0.01, total_iters=5)
cosine = CosineAnnealingLR(optimizer, T_max=45, eta_min=0)
scheduler = SequentialLR(optimizer, [warmup, cosine], milestones=[5])
```
</details>

---

## 核心要点小结

- 学习率过大：loss 震荡或 NaN；过小：loss 不动
- Adam 起步 0.001，SGD 起步 0.01，大模型微调起步 0.00001
- 衰减逻辑：前期大步快走，后期小步精修
- `scheduler.step()` 放在 epoch 循环里，不是 batch 循环里
- CosineAnnealingLR 是现代最常用的衰减策略
- 大模型训练加 warmup，先小步热身再大步走
- 训练时画 loss 曲线，用眼睛判断学习率是否合适

下一篇解决训练的另一个基础设施——GPU 训练时模型和数据怎么放到同一设备。
