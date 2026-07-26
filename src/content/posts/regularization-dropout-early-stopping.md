---
title: "正则化、Dropout 与 Early Stopping：防止过拟合的方法地图"
description: "模型训练集准确率 99%，测试集只有 70%——这是过拟合。Weight Decay、Dropout、Early Stopping、数据增强怎么选？这篇建立完整的正则化方法地图。"
cover: /images/covers/regularization-dropout-early-stopping-video.jpg
coverAlt: "第 57 课正则化视频封面，展示 Weight Decay、Dropout、Early Stopping 和数据增强的防过拟合地图。"
pubDate: 2026-07-26T09:00:00+08:00
tags: [PyTorch, 正则化, Dropout, Early Stopping, 过拟合, Weight Decay]
---

你训练了一个模型，训练集准确率 99%，兴奋地拿测试集一跑——只有 70%。模型把训练数据"背"下来了，但没学到真正的规律。这就是过拟合。

正则化就是解决过拟合的一组方法。这篇把最常用的几种讲清，让你知道什么时候用哪个。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/regularization-dropout-early-stopping-video.jpg" aria-label="第 57 课：正则化与早停">
    <source src="/videos/lesson-57-regularization-dropout-early-stopping.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 57 课视频 - 正则化、Dropout 与 Early Stopping：防止过拟合的方法地图</figcaption>
</figure>

---

## 概念回顾

第 8 篇我们讲过过拟合和欠拟合的概念——过拟合是"训练好、测试差"。第 54 篇讲 AdamW 时提到 `weight_decay`，它就是正则化的一种。今天我们把所有正则化方法串起来，建立完整地图。

---

## 一句话解释

> 正则化让模型别死记硬背训练集，而是学到更通用的规律。方法包括 Weight Decay（限制参数大小）、Dropout（随机关闭神经元）、Early Stopping（及时停止）、数据增强（多见世面）。

---

## 用一个例子理解正则化

假设两个学生准备考试：

- **学生 A**：把练习册每道题的答案都背下来了。练习册满分，新题不会——**过拟合**
- **学生 B**：理解了公式和方法。练习册 90 分，新题也能做——**泛化好**

正则化的目的就是让模型变成学生 B。

加了正则化后，模型训练时不再只追求"训练误差最小"，而是同时考虑"模型别太复杂"：

$$\text{总损失} = \text{原始损失} + \lambda \cdot \text{正则化项}$$

$\lambda$ 越大，约束越强。

---

## 方法 1：L2 正则化 / Weight Decay

### 核心思想

不要让权重参数变得太大。权重太大意味着模型对某些特征过度敏感，容易过拟合。

### 公式

$$L_{total} = L_{original} + \lambda \sum_i w_i^2$$

### 代码

```python
# AdamW 里直接设 weight_decay
optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
```

第 54 篇讲过，AdamW 的 weight_decay 是解耦的，效果比 Adam + L2 更稳定。现代深度学习首选这种方式。

| 参数 | 常用值 | 作用 |
|---|---|---|
| `weight_decay` | 0.01 | 约束强度 |

---

## 方法 2：Dropout

### 核心思想

训练时随机关闭一部分神经元，让模型不要过度依赖任何单个神经元。就像训练团队时随机让几个人请假，逼其他人也学会干活。

### 代码

```python
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(100, 256),
    nn.ReLU(),
    nn.Dropout(p=0.5),    # 训练时 50% 神经元随机失活
    nn.Linear(256, 10)
)
```

| 参数 | 常用值 | 作用 |
|---|---|---|
| `p` | 0.1 ~ 0.5 | 被丢弃的概率 |

### 关键行为

```python
model.train()   # 训练模式：Dropout 生效，随机丢弃
model.eval()    # 评估模式：Dropout 关闭，所有神经元都工作
```

**忘记 `model.eval()` 会让评估结果不稳定**——第 50 篇讲过这个陷阱。

```python
# 训练时
model.train()
out = model(x)   # 每次结果不同（Dropout 随机）

# 评估时
model.eval()
out1 = model(x)
out2 = model(x)
print(torch.equal(out1, out2))   # True，评估时确定性输出
```

---

## 方法 3：Early Stopping

### 核心思想

训练不是越久越好。当验证集 loss 不再下降（甚至开始上升），就停止训练。

### 典型训练曲线

```
训练集 loss：一直下降
验证集 loss：先下降 → 达到最低 → 开始上升（过拟合开始）
```

### 代码实现

```python
best_val_loss = float('inf')
patience = 5          # 容忍多少 epoch 不改善
no_improve = 0

for epoch in range(100):
    train_loss = train_one_epoch(...)
    val_loss = evaluate(...)

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        no_improve = 0
        # 保存最佳模型
        torch.save(model.state_dict(), 'best_model.pth')
    else:
        no_improve += 1
        if no_improve >= patience:
            print(f"Early stopping at epoch {epoch+1}")
            break

# 加载最佳模型
model.load_state_dict(torch.load('best_model.pth'))
```

| 参数 | 常用值 | 作用 |
|---|---|---|
| `patience` | 5 ~ 10 | 容忍几个 epoch 不改善 |

---

## 方法 4：数据增强

### 核心思想

人为制造更多"略有变化"的训练样本，让模型多见世面。

### 图像数据增强

```python
from torchvision import transforms

transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),    # 随机水平翻转
    transforms.RandomRotation(10),        # 随机旋转 ±10 度
    transforms.ColorJitter(brightness=0.2),  # 亮度变化
    transforms.ToTensor(),
])
```

一只猫翻转、旋转后还是猫，模型学到"猫"的本质特征，而不是记住特定角度。

### 文本数据增强

- 同义词替换
- 随机删除词
- 回译（中→英→中）

文本增强比图像增强效果弱，谨慎使用。

---

## 方法速查表

| 方法 | 核心思想 | 一句话 | 常用场景 |
|---|---|---|---|
| Weight Decay | 限制权重太大 | 别太激进 | 深度学习必用 |
| Dropout | 随机关闭神经元 | 别太依赖 | 全连接层、NLP、CV |
| Early Stopping | 验证集不升就停 | 别练过头 | 几乎所有任务 |
| 数据增强 | 制造变化样本 | 多见世面 | 图像为主 |
| BatchNorm | 稳定训练（附带正则） | 加点随机 | CNN、深度网络 |
| Label Smoothing | 标签别太绝对 | 别太自信 | 分类、Transformer |

---

## 实战推荐组合

刚开始训练，建议用这个组合：

```python
# 1. Weight Decay（优化器里设）
optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)

# 2. Dropout（模型里加）
model = nn.Sequential(
    nn.Linear(100, 256),
    nn.ReLU(),
    nn.Dropout(0.3),         # 0.3 比 0.5 温和
    nn.Linear(256, 10)
)

# 3. Early Stopping（训练循环里写）
# patience=5，保存最佳模型

# 4. 数据增强（图像任务）
# transforms.RandomFlip, RandomRotation 等
```

---

## 三个高频错误

### 错误 1：Dropout 加在最后一层

```python
# ❌ 输出层前加 Dropout，预测不稳定
model = nn.Sequential(
    nn.Linear(100, 256),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(256, 10),     # 输出层
    nn.Dropout(0.5)         # ❌ 别加在这里
)
```

Dropout 加在隐藏层之间，不要加在输出层后。

### 错误 2：Dropout 的 p 设太大

```python
nn.Dropout(p=0.8)   # 80% 都丢弃，信息损失太大，可能欠拟合
```

通常 0.1-0.5，0.3 是温和的选择。

### 错误 3：评估时忘 model.eval()

```python
# ❌ 评估时 Dropout 还在工作
for x, y in test_loader:
    logits = model(x)   # 每次结果不同

# ✅
model.eval()
with torch.no_grad():
    for x, y in test_loader:
        logits = model(x)   # 确定性输出
```

---

## 课后练习

**练习 1**：Dropout 在训练时丢弃 50% 神经元，评估时呢？为什么评估时不丢弃？

**练习 2**：下面训练配置，如果要加正则化，应该加什么？

```python
model = nn.Sequential(nn.Linear(100, 512), nn.ReLU(), nn.Linear(512, 10))
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
```

**练习 3**：训练集 loss 0.1、准确率 99%，验证集 loss 0.8、准确率 75%。这是什么问题？怎么解决？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：评估时不丢弃，所有神经元都工作。原因：Dropout 是训练时的正则化手段，评估时需要模型的完整能力做预测。PyTorch 的 Dropout 在 `model.eval()` 后自动关闭。另外，训练时被保留的神经元会放大（乘以 1/(1-p)）补偿丢弃的，评估时不需要补偿。

**练习 2**：三个建议：
1. 优化器换 AdamW 并加 weight_decay=0.01
2. 模型中间加 `nn.Dropout(0.3)`
3. 训练循环加 Early Stopping
```python
model = nn.Sequential(
    nn.Linear(100, 512), nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, 10)
)
optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
```

**练习 3**：典型过拟合——训练好、验证差。解决方案：① 加 Weight Decay。② 加 Dropout。③ Early Stopping。④ 数据增强。⑤ 减小模型容量（如 512→128）。⑥ 收集更多训练数据。
</details>

---

## 核心要点小结

- 正则化让模型别死记硬背，学到更通用的规律
- Weight Decay 限制权重太大，AdamW 里用 weight_decay=0.01
- Dropout 训练时随机关闭神经元，评估时关闭（model.eval()）
- Early Stopping 验证集不改善就停，保存最佳模型
- 数据增强让模型多见世面，图像任务必用
- 入门组合：Weight Decay + Dropout(0.3) + Early Stopping
- Dropout 加在隐藏层之间，别加在输出层后

下一篇把前面所有训练知识串起来——怎么根据 loss 和 accuracy 曲线诊断训练问题。
