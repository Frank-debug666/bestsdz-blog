---
title: Shape 是深度学习最重要的数据契约
description: 深度学习代码 80% 的报错都是 Shape 不匹配。但 Shape 不只是维度对齐，它是模型每一层之间的数据契约。这篇把 batch、特征、类别维度和常见的 Shape 流水线一次讲透。
cover: /images/covers/shape-data-contract-video.jpg
coverAlt: 第 46 课 Shape 数据契约视频封面，展示 B、F、C、H、W 等维度符号和模型流水线。
pubDate: 2026-07-07T09:20:00+08:00
tags: [PyTorch, Shape, 张量维度, 数据契约, 深度学习]
---

你有没有遇到过这种报错：

```
RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x784 and 10x256)
```

然后你盯着数字看半天，不知道 784 和 10 哪个对哪个错。

或者更阴险的情况：代码不报错，loss 也在降，但准确率死活上不去——最后发现是标签维度搞错了，模型学了个寂寞。

Shape 不是"凑对就行"的细节，它是模型每一层之间的**数据契约**。这一篇我们把 batch、特征、类别这几个维度彻底理清楚，让你看到任何 Shape 都能一眼判断对不对。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/shape-data-contract-video.jpg" aria-label="第 46 课：Shape 数据契约">
    <source src="/videos/lesson-46-shape-data-contract.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 46 课视频 - Shape 是深度学习最重要的数据契约</figcaption>
</figure>

---

## 概念回顾

第 15 篇我们学了 Tensor 的基本概念，第 43 篇补齐了 dtype、device、索引切片。今天我们聚焦 Tensor 最容易出问题的维度——Shape。第 45 篇刚讲完计算图，你记住：计算图里的每个节点都是一个 Tensor，每个 Tensor 都有 Shape，Shape 错了图就断了。

---

## 一句话解释

> Shape 是 Tensor 每个维度的大小。深度学习里每个维度都有约定俗成的含义——第 0 维是 batch，最后一维通常是特征或类别，搞反了模型就废了。

---

## 五个你必须背下来的维度符号

后面所有文章都会用到这些符号，先把它们刻在脑子里：

| 符号 | 含义 | 典型场景 |
|---|---|---|
| `B` | batch size，一批多少个样本 | 所有任务 |
| `F` | feature，特征数量 | 表格数据 |
| `C` | channel，通道数 | 图像（RGB=3） |
| `H` / `W` | 高 / 宽 | 图像 |
| `T` | sequence length，序列长度 | 文本、时间序列 |
| `D` | embedding dimension，向量维度 | 词向量 |
| `V` | vocabulary size，词表大小 | NLP |
| `num_classes` | 类别数 | 分类任务 |

---

## Shape 变化的四类本质操作

不管什么层、什么模型，Shape 的变化逃不出这四类：

| 类型 | 操作 | 例子 |
|---|---|---|
| **增加维度** | `unsqueeze`、`stack`、DataLoader 加 batch | `[F] → [B, F]` |
| **删除维度** | `squeeze`、`flatten`、`pooling` | `[B,C,H,W] → [B,C*H*W]` |
| **改变维度大小** | `Linear`、`Conv2d`、`Embedding` | `[B,10] → [B,32]` |
| **调换维度顺序** | `transpose`、`permute` | `[B,H,W,C] → [B,C,H,W]` |

记住这四类，看到任何 Shape 变化你都能归类。

---

## 三条核心 Shape 流水线

这是全文最重要的部分。把这三条流水线记牢，你就能看懂 80% 的训练代码。

### 流水线 1：表格分类

```text
原始数据 [B, F]
   ↓ Linear(in=F, out=hidden)
[B, hidden]
   ↓ Linear(in=hidden, out=num_classes)
[B, num_classes]
   ↓ CrossEntropyLoss
target: [B]
```

每个样本有 F 个特征，经过两层全连接，最后输出 num_classes 个分数。

```python
import torch.nn as nn

class TableClassifier(nn.Module):
    def __init__(self, in_features, hidden, num_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden),
            nn.ReLU(),
            nn.Linear(hidden, num_classes)
        )
    def forward(self, x):
        return self.net(x)   # [B, F] → [B, num_classes]

model = TableClassifier(20, 64, 4)
criterion = nn.CrossEntropyLoss()

# 验证 Shape
x = torch.randn(32, 20)          # [B=32, F=20]
logits = model(x)
print(logits.shape)               # torch.Size([32, 4])
y = torch.randint(0, 4, (32,))    # [B=32]，注意是 1 维，不是 [32, 4]
loss = criterion(logits, y)       # ✅ logits [32,4] 对 y [32]
```

**最容易错的地方**：`CrossEntropyLoss` 的标签是 `[B]`，不是 `[B, num_classes]`（不是 one-hot）。

### 流水线 2：图像分类（CNN）

```text
图片输入 [B, 3, 32, 32]
   ↓ Conv2d(3→16)
[B, 16, 32, 32]
   ↓ MaxPool2d(2)
[B, 16, 16, 16]
   ↓ Conv2d(16→32)
[B, 32, 16, 16]
   ↓ MaxPool2d(2)
[B, 32, 8, 8]
   ↓ Flatten
[B, 32*8*8]   = [B, 2048]
   ↓ Linear(2048, num_classes)
[B, num_classes]
```

```python
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),   # [B,3,32,32]→[B,16,32,32]
            nn.ReLU(),
            nn.MaxPool2d(2),                   # →[B,16,16,16]
            nn.Conv2d(16, 32, 3, padding=1),  # →[B,32,16,16]
            nn.ReLU(),
            nn.MaxPool2d(2),                   # →[B,32,8,8]
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),                      # →[B, 2048]
            nn.Linear(32 * 8 * 8, num_classes) # →[B, 10]
        )
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x
```

**关键检查点**：`Flatten` 之后接 `Linear`，`Linear` 的 `in_features` 必须**精确等于** `C*H*W`。算错了就报 `mat1 and mat2 shapes cannot be multiplied`。

### 流水线 3：二分类

```text
输入 [B, F]
   ↓ Linear
[B, hidden]
   ↓ Linear(out=1)
[B, 1]
   ↓ BCEWithLogitsLoss
target: [B, 1]   ← 注意是 2 维，标签是 float
```

```python
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 1)         # 输出 1 个 logit
)
criterion = nn.BCEWithLogitsLoss()

x = torch.randn(32, 20)
logits = model(x)             # [32, 1]
y = torch.randint(0, 2, (32, 1)).float()   # [32, 1]，注意 .float()！
loss = criterion(logits, y)   # ✅
```

**二分类 vs 多分类的 Shape 差异**——这张表请背下来：

| 任务 | 模型输出 | 标签 Shape | 标签类型 | 损失函数 |
|---|---|---|---|---|
| 多分类 | `[B, num_classes]` | `[B]` | `long` | `CrossEntropyLoss` |
| 二分类 | `[B, 1]` | `[B, 1]` | `float` | `BCEWithLogitsLoss` |

---

## DataLoader：最前面永远多一个 B

这是新手最常忽略的事：单个样本没有 batch 维度，经过 DataLoader 后自动在最前面加一个 `B`。

```python
# 单个样本
x_single = torch.randn(10)        # [10]
print(x_single.shape)             # torch.Size([10])

# 经过 DataLoader
from torch.utils.data import TensorDataset, DataLoader
dataset = TensorDataset(torch.randn(100, 10), torch.randint(0, 3, (100,)))
loader = DataLoader(dataset, batch_size=32)

for x, y in loader:
    print(x.shape)   # torch.Size([32, 10])  ← 多了个 32
    print(y.shape)   # torch.Size([32])
    break
```

**口诀**：DataLoader 后，最前面一定多一个 B。

---

## 三个高频报错与排查

### 报错 1：mat1 and mat2 shapes cannot be multiplied

```
RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x784 and 10x256)
```

**原因**：Linear 的 `in_features` 和输入最后一维对不上。

```python
x = torch.randn(32, 784)
layer = nn.Linear(10, 256)    # in_features=10，但输入是 784
layer(x)   # ❌ 报错
```

**修复**：把 `in_features` 改成 784。

### 报错 2：Expected target size

```
RuntimeError: Expected target size [32, 10], got [32]
```

**原因**：多分类标签写成了 one-hot `[B, num_classes]`，但 `CrossEntropyLoss` 要的是 `[B]`。

```python
# ❌ 错误：标签是 one-hot
y_onehot = torch.zeros(32, 10)
y_onehot[range(32), torch.randint(0, 10, (32,))] = 1
loss = criterion(logits, y_onehot)

# ✅ 正确：标签是类别索引
y = torch.randint(0, 10, (32,))
loss = criterion(logits, y)
```

### 报错 3：Expected object of scalar type Long

```
RuntimeError: Expected object of scalar type Long but got Float
```

**原因**：`CrossEntropyLoss` 的标签必须是 `torch.long`，但传了 float。

```python
y = torch.randint(0, 10, (32,)).float()   # ❌ float
loss = criterion(logits, y)

y = torch.randint(0, 10, (32,)).long()    # ✅ long
loss = criterion(logits, y)
# 或者
y = y.long()
```

---

## 排查 Shape 的万能方法

在每个层后面 `print(x.shape)`，是排查 Shape 最快的方法。

```python
def forward(self, x):
    print("输入:", x.shape)
    x = self.conv1(x)
    print("conv1 后:", x.shape)
    x = self.pool(x)
    print("pool 后:", x.shape)
    x = self.flatten(x)
    print("flatten 后:", x.shape)
    x = self.fc(x)
    print("fc 后:", x.shape)
    return x
```

---

## 课后练习

**练习 1**：一个 CNN 输入是 `[64, 3, 28, 28]`，经过 `Conv2d(3, 32, 3, padding=1)` 后 Shape 是多少？再经过 `MaxPool2d(2)` 呢？最后 Flatten 后接 Linear，`in_features` 应该是多少？

**练习 2**：下面代码为什么报错？怎么改？

```python
model = nn.Linear(100, 5)
x = torch.randn(32, 10, 100)
y = model(x)
```

**练习 3**：多分类任务，`num_classes=7`，`batch_size=16`。写出模型输出、标签、loss 的 Shape 和类型。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
- Conv2d(3, 32, 3, padding=1)：padding=1 + kernel=3 + stride=1 保持尺寸不变，Shape `[64, 32, 28, 28]`
- MaxPool2d(2)：尺寸减半，Shape `[64, 32, 14, 14]`
- Flatten：`[64, 32*14*14]` = `[64, 6272]`
- Linear 的 in_features = 32 * 14 * 14 = 6272

**练习 2**：不报错。Linear 只看最后一维，`[32, 10, 100]` 经过 `Linear(100, 5)` 变成 `[32, 10, 5]`。这是 Linear 的广播特性——它只作用在最后一维。如果本意是让每个样本只输出一个 5 维向量，那输入应该是 `[32, 100]`，需要先 reshape。

**练习 3**：
- 模型输出 logits：Shape `[16, 7]`，类型 float
- 标签 y：Shape `[16]`，类型 long
- loss：标量，Shape `[]`（0 维）
</details>

---

## 核心要点小结

- Shape 是每层之间的数据契约，维度含义约定俗成：第 0 维是 batch
- 三条核心流水线：表格分类、图像分类、二分类——背下来
- 多分类标签是 `[B]` 且类型 long；二分类标签是 `[B, 1]` 且类型 float
- DataLoader 自动在最前面加 batch 维
- 排查 Shape 最快的方法：每层后面 `print(x.shape)`

下一篇我们解决实战中最头疼的问题：reshape、view、transpose 和广播机制到底什么时候用哪个。
