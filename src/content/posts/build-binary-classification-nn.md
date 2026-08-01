---
title: "从零搭建二维分类神经网络：模型到底怎么分开两类点"
description: "线性回归是连续预测，分类是离散判断。这篇从零搭建一个二分类神经网络，用二维数据让你能\"看到\"模型怎么把两类点分开。"
cover: /images/covers/build-binary-classification-nn-video.jpg
coverAlt: "第 60 课二分类神经网络视频封面，展示二维点、logit、概率与分类边界的完整训练链路。"
pubDate: 2026-08-01T09:00:00+08:00
tags: [PyTorch, 二分类, 神经网络, BCEWithLogitsLoss, 从零搭建]
---

上一篇我们用线性回归跑通了完整流程。今天升级到分类任务——模型不再预测一个数字，而是判断"属于哪一类"。

用二维数据是因为你能画出来——亲眼看到模型把两类点分开，比看 loss 曲线直观一百倍。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/build-binary-classification-nn-video.jpg" aria-label="第 60 课：二维二分类神经网络">
    <source src="/videos/lesson-60-build-binary-classification-nn.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-60-build-binary-classification-nn.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 60 课视频 - 从零搭建二维分类神经网络：模型到底怎么分开两类点</figcaption>
</figure>

---

## 概念回顾

第 29 篇讲过逻辑回归——分类的本质是用 Sigmoid 把输出压到 0-1 之间表示概率。第 46 篇讲过二分类的 Shape 约定：输出 `[B, 1]`，标签 `[B, 1]` 且 float，用 `BCEWithLogitsLoss`。第 50 篇讲了怎么用 nn.Module 定义模型。今天把它们合起来。

---

## 项目目标

造两组二维点（比如两个簇），训练一个神经网络把它们分开。模型输入 `[x1, x2]`，输出"属于第 1 类的概率"。

---

## 第一步：造数据

```python
import torch
import matplotlib.pyplot as plt

torch.manual_seed(42)

# 两类点，各 200 个
n = 200
# 类别 0：中心在 (2, 2)
x0 = torch.randn(n, 2) + torch.tensor([2.0, 2.0])
y0 = torch.zeros(n, 1)

# 类别 1：中心在 (-2, -2)
x1 = torch.randn(n, 2) + torch.tensor([-2.0, -2.0])
y1 = torch.ones(n, 1)

# 拼接
x = torch.cat([x0, x1], dim=0)     # [400, 2]
y = torch.cat([y0, y1], dim=0)     # [400, 1]

# 打乱
idx = torch.randperm(len(x))
x, y = x[idx], y[idx]

print(f"x shape: {x.shape}")   # [400, 2]
print(f"y shape: {y.shape}")   # [400, 1]
print(f"y dtype: {y.dtype}")   # float

# 可视化
plt.scatter(x0[:, 0], x0[:, 1], label='类别 0', alpha=0.5)
plt.scatter(x1[:, 0], x1[:, 1], label='类别 1', alpha=0.5)
plt.legend()
plt.title('训练数据')
plt.show()
```

---

## 第二步：Dataset 和 DataLoader

```python
from torch.utils.data import TensorDataset, DataLoader

dataset = TensorDataset(x, y)
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)
```

---

## 第三步：定义模型

```python
import torch.nn as nn

class BinaryClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(2, 16),    # 输入 2 维 → 隐藏 16 维
            nn.ReLU(),
            nn.Linear(16, 8),    # 隐藏 16 → 隐藏 8
            nn.ReLU(),
            nn.Linear(8, 1)      # 隐藏 8 → 输出 1（logit）
        )

    def forward(self, x):
        return self.net(x)       # [B, 2] → [B, 1]

model = BinaryClassifier()
```

**关键**：最后一层是 `Linear(8, 1)`，输出的是 **logit**，不是概率。不要在这里加 Sigmoid——`BCEWithLogitsLoss` 内部自带。

---

## 第四步：损失函数和优化器

```python
criterion = nn.BCEWithLogitsLoss()   # 二分类标准损失
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
```

| 选择 | 理由 |
|---|---|
| `BCEWithLogitsLoss` | 二分类标准，内部带 Sigmoid |
| `Adam` | 入门友好 |
| `lr=0.01` | 简单数据，稍大收敛快 |

---

## 第五步：训练循环

```python
epochs = 50

for epoch in range(epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch_x, batch_y in train_loader:
        optimizer.zero_grad()
        logits = model(batch_x)          # [B, 1]
        loss = criterion(logits, batch_y)  # batch_y: [B, 1], float

        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        # 准确率：logit > 0 等价于 sigmoid > 0.5 等价于 预测类别 1
        preds = (logits > 0).float()
        correct += (preds == batch_y).sum().item()
        total += batch_y.size(0)

    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: Loss={total_loss/total:.4f}, Acc={correct/total:.4f}")
```

典型输出：

```
Epoch 10: Loss=0.2341, Acc=0.9175
Epoch 20: Loss=0.1023, Acc=0.9750
Epoch 30: Loss=0.0512, Acc=0.9925
Epoch 40: Loss=0.0287, Acc=0.9975
Epoch 50: Loss=0.0178, Acc=1.0000
```

---

## 第六步：评估和预测

```python
model.eval()
with torch.no_grad():
    logits = model(x)               # 全部数据
    probs = torch.sigmoid(logits)    # 转成概率
    preds = (probs > 0.5).float()    # 0.5 为阈值

    accuracy = (preds == y).float().mean()
    print(f"总准确率: {accuracy:.4f}")
```

---

## 关键概念：logit vs 概率

```python
# 模型输出的是 logit（未归一化的分数）
logit = model(x)           # 可以是任意实数，如 -3.2 或 5.1

# 用 Sigmoid 转成概率
prob = torch.sigmoid(logit)  # 压缩到 (0, 1)

# 0.5 为分类阈值
pred = (prob > 0.5).float()  # >0.5 → 1，否则 → 0
```

**为什么不直接在模型里加 Sigmoid？** 因为 `BCEWithLogitsLoss` 内部用了一个数值更稳定的公式（LogSumExp 技巧），比手动 Sigmoid + BCELoss 更安全。

---

## 三个高频错误

### 错误 1：标签类型是 long

```python
# ❌ 标签是 long（多分类的写法）
y = torch.zeros(n, 1).long()
criterion(logits, y)   # 报错

# ✅ 二分类标签是 float
y = torch.zeros(n, 1).float()
```

第 46 篇的表：多分类标签 long，二分类标签 float。

### 错误 2：模型最后加了 Sigmoid

```python
# ❌ 重复 Sigmoid
self.net = nn.Sequential(..., nn.Linear(8, 1), nn.Sigmoid())
criterion = nn.BCEWithLogitsLoss()   # 内部又 Sigmoid 一次

# ✅ 不要加
self.net = nn.Sequential(..., nn.Linear(8, 1))
```

### 错误 3：预测时用 logit 判断而不转概率

```python
# 技术上没错（logit > 0 等价 prob > 0.5），但不直观
preds = (logits > 0).float()

# 更清晰的写法
probs = torch.sigmoid(logits)
preds = (probs > 0.5).float()
```

---

## 课后练习

**练习 1**：把两类点的中心改成 (1, 1) 和 (-1, -1)（更近），观察准确率变化。

**练习 2**：模型只有一层 `nn.Linear(2, 1)`（没有隐藏层和 ReLU），能分开这两类点吗？为什么？

**练习 3**：怎么把这个二分类改成三分类？列出需要改的地方。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：两类中心更近，重叠更多，准确率会下降。可能需要更深的模型或更多训练。

**练习 2**：能。因为这两类点是线性可分的（两个簇不重叠），一条直线就能分开。`nn.Linear(2, 1)` 就是画一条线。但如果数据不是线性可分的（比如同心圆），单层就不够，需要隐藏层 + 激活函数引入非线性。

**练习 3**：
- 最后一层改成 `nn.Linear(8, 3)`，输出 3 个 logit
- 损失函数改成 `nn.CrossEntropyLoss()`
- 标签改成 `[B]`（1 维），类型 long
- 预测用 `torch.argmax(logits, dim=1)`
</details>

---

## 核心要点小结

- 二分类模型输出 1 个 logit，用 `BCEWithLogitsLoss`
- 标签 Shape `[B, 1]`，类型 float——和多分类不同
- 不要在模型最后加 Sigmoid，损失函数内部自带
- logit > 0 等价概率 > 0.5，但建议显式 `torch.sigmoid` 更清晰
- 线性可分的数据单层就能分，非线性可分需要隐藏层 + ReLU

下一篇把这个分类结果画出来——决策边界可视化，看模型到底学出了什么形状。
