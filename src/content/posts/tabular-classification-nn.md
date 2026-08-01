---
title: "表格分类项目：从 CSV 到神经网络预测"
description: "前面用造的数据练手，这次用真实 CSV 表格数据。从读取、预处理、模型搭建到训练评估，走完表格分类的完整流程。"
cover: /images/covers/tabular-classification-nn-video.jpg
coverAlt: "第 62 课表格分类视频封面，展示 CSV、数据划分、标准化、DataLoader、MLP 与分类评估流程。"
pubDate: 2026-08-01T09:40:00+08:00
tags: [PyTorch, 表格分类, CSV, 多分类, 完整项目]
---

前面两个项目用造的数据，干净又简单。真实项目里数据是 CSV 文件——有表头、有混合类型、有缺失值。这篇走完从 CSV 到预测的完整流程。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/tabular-classification-nn-video.jpg" aria-label="第 62 课：CSV 表格分类项目">
    <source src="/videos/lesson-62-tabular-classification-nn.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-62-tabular-classification-nn.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 62 课视频 - 表格分类项目：从 CSV 到神经网络预测</figcaption>
</figure>

---

## 概念回顾

第 48 篇学了自定义 Dataset，第 50 篇学了 nn.Module，第 46 篇学了多分类的 Shape 约定（输出 `[B, num_classes]`，标签 `[B]` 且 long，用 `CrossEntropyLoss`）。今天把它们用在真实 CSV 数据上。第 23 篇的 Pandas 清洗也用得上。

---

## 项目目标

从 CSV 读取表格数据，训练一个多分类神经网络，输出分类报告。

---

## 第一步：读取和探索数据

```python
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader

# 假设 CSV：20 个特征列 + 1 个标签列（4 分类）
df = pd.read_csv('data.csv')
print(df.shape)          # (2000, 21)
print(df.dtypes)         # 检查数据类型
print(df['label'].value_counts())   # 查看类别分布
print(df.isnull().sum().sum())      # 缺失值数量
```

---

## 第二步：预处理

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 分特征和标签
X = df.iloc[:, :-1].values
y = df.iloc[:, -1].values

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 标准化（神经网络对尺度敏感）
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# 转 Tensor
X_train = torch.tensor(X_train).float()
X_test = torch.tensor(X_test).float()
y_train = torch.tensor(y_train).long()   # 多分类标签是 long
y_test = torch.tensor(y_test).long()

print(f"训练集: {X_train.shape}, {y_train.shape}")
print(f"测试集: {X_test.shape}, {y_test.shape}")
print(f"类别数: {len(torch.unique(y_train))}")
```

---

## 第三步：Dataset 和 DataLoader

```python
class TabularDataset(Dataset):
    def __init__(self, features, labels):
        self.features = features
        self.labels = labels

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

train_dataset = TabularDataset(X_train, y_train)
test_dataset = TabularDataset(X_test, y_test)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
```

---

## 第四步：定义模型

```python
import torch.nn as nn

class TabularClassifier(nn.Module):
    def __init__(self, in_features, num_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),       # 稳定训练
            nn.Dropout(0.3),           # 正则化
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)  # 输出 num_classes 个 logit
        )

    def forward(self, x):
        return self.net(x)

model = TabularClassifier(in_features=20, num_classes=4)
print(model)
```

---

## 第五步：训练

```python
import torch.optim as optim

criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)

epochs = 50

for epoch in range(epochs):
    model.train()
    train_loss = 0
    correct = 0
    total = 0

    for batch_x, batch_y in train_loader:
        optimizer.zero_grad()
        logits = model(batch_x)           # [B, 4]
        loss = criterion(logits, batch_y)  # batch_y: [B], long
        loss.backward()
        optimizer.step()

        train_loss += loss.item()
        preds = logits.argmax(dim=1)
        correct += (preds == batch_y).sum().item()
        total += batch_y.size(0)

    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: Loss={train_loss/total:.4f}, "
              f"Acc={correct/total:.4f}")
```

---

## 第六步：评估

```python
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

model.eval()
all_preds = []
all_labels = []

with torch.no_grad():
    for batch_x, batch_y in test_loader:
        logits = model(batch_x)
        preds = logits.argmax(dim=1)
        all_preds.extend(preds.numpy())
        all_labels.extend(batch_y.numpy())

# 分类报告
print(classification_report(all_labels, all_preds))
#               precision  recall  f1-score  support
#      类别 0       0.85     0.88     0.86      100
#      类别 1       0.82     0.79     0.81      100
#      ...

# 混淆矩阵
print(confusion_matrix(all_labels, all_preds))
```

---

## 三个高频错误

### 错误 1：忘标准化

```python
# ❌ 直接用原始数据，特征尺度差异大
X = df.iloc[:, :-1].values   # 有的特征 0-1，有的 0-10000

# ✅ 标准化
scaler = StandardScaler()
X = scaler.fit_transform(X)
```

第 26 篇讲过标准化——神经网络对输入尺度敏感。

### 错误 2：标签是 float 或 one-hot

```python
# ❌ float 标签
y = torch.tensor(y).float()   # CrossEntropyLoss 报错

# ❌ one-hot
y_onehot = nn.functional.one_hot(y, num_classes)

# ✅ 类别索引，long
y = torch.tensor(y).long()    # [B]
```

### 错误 3：标准化时用了测试集信息

```python
# ❌ 用全部数据 fit，测试集信息泄漏
scaler.fit(X_all)
X_train = scaler.transform(X_train)
X_test = scaler.transform(X_test)

# ✅ 只用训练集 fit
scaler.fit(X_train)
X_train = scaler.transform(X_train)
X_test = scaler.transform(X_test)   # 用训练集的参数 transform 测试集
```

---

## 课后练习

**练习 1**：数据有 3 个类别，分别 1000、200、50 条。这种不平衡数据怎么处理？

**练习 2**：模型训练集准确率 95%，测试集 70%。加什么正则化？

**练习 3**：为什么标准化只能用训练集 fit？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
1. 用 `CrossEntropyLoss(weight=class_weights)` 给小类更大权重
2. 过采样小类或欠采样大类
3. 用 F1 而非准确率评估

**练习 2**：① 加 Dropout（0.3-0.5）。② AdamW 加 weight_decay=0.01。③ Early Stopping。④ 减小模型容量（128→64）。

**练习 3**：如果用测试集参与 fit，等于让模型"偷看"了测试集的统计信息（均值、方差），这是数据泄漏。评估时结果会偏乐观。标准化只能用训练集的参数，测试集用训练集算出的均值方差去 transform。
</details>

---

## 核心要点小结

- 表格分类流程：CSV → 标准化 → Dataset → DataLoader → MLP → 训练 → 评估
- 标准化只用训练集 fit，测试集只 transform
- 多分类标签是 `[B]` 且 long，不是 one-hot 也不是 float
- 模型加 BatchNorm 稳定训练，加 Dropout 正则化
- 用 classification_report 看精确率/召回率/F1
- 类别不平衡时用 loss 的 weight 参数

下一篇讲模型保存和加载——训练完的模型怎么存下来、怎么用来批量预测。
