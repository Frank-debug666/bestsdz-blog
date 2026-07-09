---
title: 自定义 Dataset：怎样封装自己的训练数据
description: PyTorch 内置数据集只够入门练手。真实项目里你的数据可能是 CSV、文件夹图片、JSON 文本——这时候必须自己写 Dataset。这篇把 __len__ 和 __getitem__ 讲透，附带三个真实场景。
cover: /images/covers/custom-dataset-video.jpg
coverAlt: 第 48 课自定义 Dataset 视频封面，展示 __len__、__getitem__、Dataset 到 DataLoader 的数据流。
pubDate: 2026-07-09T09:00:00+08:00
tags: [PyTorch, Dataset, 自定义数据集, 数据加载, __getitem__]
---

你跟着教程跑 MNIST、CIFAR-10，一切顺利——因为 `torchvision.datasets` 帮你把脏活干完了。但真到了自己的项目：数据是文件夹里的图片、是带脏数据的 CSV、是几十个 JSON 文件，你才发现根本不知道怎么把数据喂进模型。

这一篇就解决这个问题：自己写 Dataset。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/custom-dataset-video.jpg" aria-label="第 48 课：自定义 Dataset">
    <source src="/videos/lesson-48-custom-dataset.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 48 课视频 - 自定义 Dataset：怎样封装自己的训练数据</figcaption>
</figure>

---

## 概念回顾

第 17 篇我们第一次接触 DataLoader，它负责批量读取、打乱、并行加载。第 47 篇（上一篇）我们讲了张量形状转换。今天往数据上游走一步——DataLoader 吃的是什么？是 Dataset。Dataset 定义"数据长什么样、怎么取一条"，DataLoader 定义"怎么批量地取"。

---

## 一句话解释

> 自定义 Dataset 就是继承 `torch.utils.data.Dataset`，实现两个方法：`__len__` 告诉 PyTorch 数据有多少条，`__getitem__` 告诉它第 i 条数据是什么。

---

## 最小可运行模板

```python
from torch.utils.data import Dataset

class MyDataset(Dataset):
    def __init__(self, features, labels):
        """初始化时把数据存进来"""
        self.features = features
        self.labels = labels

    def __len__(self):
        """返回数据总量"""
        return len(self.features)

    def __getitem__(self, index):
        """返回第 index 条数据 (x, y)"""
        x = self.features[index]
        y = self.labels[index]
        return x, y
```

就这么多。`__init__` 存数据，`__len__` 报数量，`__getitem__` 按索引取一条。然后就能丢给 DataLoader：

```python
from torch.utils.data import DataLoader
import torch

features = torch.randn(1000, 20)              # 1000 条，每条 20 特征
labels = torch.randint(0, 3, (1000,))          # 3 分类

dataset = MyDataset(features, labels)
loader = DataLoader(dataset, batch_size=32, shuffle=True)

for x, y in loader:
    print(x.shape, y.shape)   # [32, 20] [32]
    break
```

---

## 两个必须实现的方法详解

### `__len__(self)` → int

告诉 PyTorch 这个数据集有多少条数据。DataLoader 要靠它算"一个 epoch 有多少个 batch"。

```python
def __len__(self):
    return len(self.features)   # 数据量
```

### `__getitem__(self, index)` → (x, y)

返回第 `index` 条数据。这是最灵活的地方——你可以在这里做任何预处理。

| 输入 | 输出 | 含义 |
|---|---|---|
| `index`（int） | `(x, y)` 元组 | 第 index 条的特征和标签 |

返回的 `x` 和 `y` 最好是 Tensor，DataLoader 会自动把它们拼成 batch。

---

## 三个真实场景

### 场景 1：CSV 表格数据

```python
import pandas as pd
import torch
from torch.utils.data import Dataset

class CSVDataset(Dataset):
    def __init__(self, csv_path, has_label=True):
        df = pd.read_csv(csv_path)
        if has_label:
            self.features = torch.tensor(df.iloc[:, :-1].values).float()
            self.labels = torch.tensor(df.iloc[:, -1].values).long()
        else:
            self.features = torch.tensor(df.values).float()

    def __len__(self):
        return len(self.features)

    def __getitem__(self, index):
        x = self.features[index]
        y = self.labels[index]
        return x, y

dataset = CSVDataset("data.csv")
print(len(dataset))         # 数据条数
print(dataset[0])           # 第一条 (x, y)
```

### 场景 2：文件夹图片

```python
from PIL import Image
from pathlib import Path
import torch
from torch.utils.data import Dataset
from torchvision import transforms

class ImageFolderDataset(Dataset):
    def __init__(self, root, transform=None):
        self.root = Path(root)
        # 假设结构：root/类别名/图片.jpg
        self.samples = []
        self.class_to_idx = {}
        for idx, class_dir in enumerate(sorted(self.root.iterdir())):
            if class_dir.is_dir():
                self.class_to_idx[class_dir.name] = idx
                for img_path in class_dir.iterdir():
                    if img_path.suffix in ('.jpg', '.png'):
                        self.samples.append((img_path, idx))
        self.transform = transform or transforms.ToTensor()

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        img_path, label = self.samples[index]
        img = Image.open(img_path).convert('RGB')
        img = self.transform(img)      # 在这里做预处理
        return img, label

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])
dataset = ImageFolderDataset("data/images", transform=transform)
```

**关键点**：图片在 `__getitem__` 里才读取——不要在 `__init__` 里把所有图片读进内存，会爆。

### 场景 3：中文文本数据

```python
import jieba
import torch
from torch.utils.data import Dataset

class TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len=100):
        self.texts = texts
        self.labels = labels
        self.vocab = vocab              # 词到 ID 的映射
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, index):
        # 在这里分词、转 ID、截断/填充
        words = jieba.lcut(self.texts[index])
        ids = [self.vocab.get(w, 0) for w in words][:self.max_len]
        # 填充到固定长度
        if len(ids) < self.max_len:
            ids += [0] * (self.max_len - len(ids))
        x = torch.tensor(ids).long()
        y = self.labels[index]
        return x, y
```

**关键点**：分词、转 ID、Padding 这些预处理放在 `__getitem__` 里，DataLoader 的多进程能并行加速。

---

## 输入、输出和 Shape

```
Dataset.__getitem__(index)
  输入：index (int)
  输出：(x, y)
    x: 单个样本的特征，如 [F] 或 [C, H, W]
    y: 单个标签，如标量

经过 DataLoader(batch_size=B) 后：
  x: [B, F] 或 [B, C, H, W]   ← 自动加了 batch 维
  y: [B]
```

上一篇我们说过"DataLoader 后最前面一定多一个 B"——这就是 Dataset 和 DataLoader 的分工：Dataset 吐单条，DataLoader 拼成 batch。

---

## 三个高频错误

### 错误 1：在 __init__ 里读所有图片

```python
# ❌ 10 万张图片直接读进内存
def __init__(self, root):
    self.images = [Image.open(p) for p in all_paths]   # 内存爆炸
```

**修复**：`__init__` 只存路径，`__getitem__` 里才读图。

### 错误 2：__getitem__ 返回的类型不一致

```python
# ❌ 有的返回 numpy，有的返回 tensor
def __getitem__(self, index):
    if random.random() > 0.5:
        return np.array(x), y       # numpy
    return torch.tensor(x), y       # tensor
```

DataLoader 拼批量时类型不一致会报错。**修复**：统一返回 Tensor。

### 错误 3：返回的 y 不是 Tensor

```python
# ❌ 返回 Python int
def __getitem__(self, index):
    return self.features[index], int(self.labels[index])
```

DataLoader 拼出来的 batch 标签可能是 list 而不是 Tensor，下游算 loss 报错。**修复**：返回 `torch.tensor(label)`。

---

## 课后练习

**练习 1**：写一个 Dataset，从 JSON 文件读取数据（每行一个 `{"text": "...", "label": 1}`），`__getitem__` 返回文本长度和标签。

**练习 2**：下面的 Dataset 哪里有问题？

```python
class BadDataset(Dataset):
    def __init__(self, data):
        self.data = data
    def __getitem__(self, index):
        return self.data[index]
```

**练习 3**：训练集和测试集怎么用同一个 Dataset 类分开？写出代码思路。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
```python
import json
import torch
from torch.utils.data import Dataset

class JsonDataset(Dataset):
    def __init__(self, json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        self.data = [json.loads(line) for line in lines]
    def __len__(self):
        return len(self.data)
    def __getitem__(self, index):
        item = self.data[index]
        x = torch.tensor(len(item["text"])).float()
        y = torch.tensor(item["label"]).long()
        return x, y
```

**练习 2**：缺 `__len__` 方法。DataLoader 需要它来计算 epoch 长度和 batch 数量。补上：
```python
def __len__(self):
    return len(self.data)
```

**练习 3**：给 Dataset 加一个参数区分训练/测试，或者分别实例化两个 Dataset：
```python
train_dataset = CSVDataset("train.csv")
test_dataset = CSVDataset("test.csv")
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
```
测试集 shuffle=False 是惯例，方便对照预测和真实标签。
</details>

---

## 核心要点小结

- 自定义 Dataset 只需实现 `__len__` 和 `__getitem__` 两个方法
- `__init__` 存路径或索引，`__getitem__` 做实际的数据读取和预处理
- 图片、文本等重数据在 `__getitem__` 里才读，别在 `__init__` 全读进内存
- `__getitem__` 返回的 x 和 y 都应是 Tensor，类型要一致
- Dataset 吐单条，DataLoader 拼 batch——分工明确

下一篇进阶：DataLoader 的 batch、shuffle、num_workers 到底怎么影响训练效率。
