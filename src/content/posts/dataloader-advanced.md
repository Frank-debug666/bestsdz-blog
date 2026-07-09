---
title: DataLoader 进阶：batch、shuffle 与并行加载怎样影响训练效率
description: 第 17 篇你学了 DataLoader 的基本用法。但 batch_size 调多大、shuffle 为什么必须开、num_workers 设几、drop_last 有什么用——这些细节决定训练是 5 分钟还是 5 小时。
cover: /images/covers/dataloader-advanced-video.jpg
coverAlt: 第 49 课 DataLoader 进阶视频封面，展示 batch_size、shuffle、num_workers、pin_memory 和 collate_fn。
pubDate: 2026-07-09T09:20:00+08:00
tags: [PyTorch, DataLoader, batch_size, num_workers, 训练效率]
---

第 17 篇你写过 `DataLoader(dataset, batch_size=32, shuffle=True)`，跑通了训练。但后来你发现：batch_size 设 32 还是 256，训练效果不一样；num_workers 设 0 还是 4，速度差好几倍；drop_last 加不加，BatchNorm 的表现也不同。

这些不是玄学。这一篇把 DataLoader 每个参数的作用和取舍讲透。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/dataloader-advanced-video.jpg" aria-label="第 49 课：DataLoader 进阶">
    <source src="/videos/lesson-49-dataloader-advanced.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 49 课视频 - DataLoader 进阶：batch、shuffle 与并行加载怎样影响训练效率</figcaption>
</figure>

---

## 概念回顾

第 17 篇 DataLoader 的三个基础参数：`dataset`（数据源）、`batch_size`（每批多少条）、`shuffle`（是否打乱）。上一篇我们学了怎么写自定义 Dataset。今天我们把这些拼起来，看 DataLoader 的高级参数如何影响训练。

---

## DataLoader 全参数一览

```python
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,              # 数据集对象
    batch_size=32,        # 每批样本数
    shuffle=True,         # 每个 epoch 打乱数据
    num_workers=4,         # 多进程加载
    pin_memory=True,       # 锁页内存，加速 GPU 传输
    drop_last=False,       # 丢弃最后不完整的 batch
    collate_fn=None,       # 自定义批次拼接方式
)
```

| 参数 | 默认值 | 作用 |
|---|---|---|
| `batch_size` | 1 | 每批样本数量 |
| `shuffle` | False | 是否打乱 |
| `num_workers` | 0 | 数据加载进程数 |
| `pin_memory` | False | 锁页内存，GPU 训练加速 |
| `drop_last` | False | 丢弃最后不足 batch_size 的 batch |
| `collate_fn` | None | 自定义如何把多条数据拼成一个 batch |

---

## batch_size：不只是大小问题

batch_size 影响三件事：训练速度、梯度质量和显存占用。

| batch_size | 训练速度 | 梯度质量 | 显存占用 |
|---|---|---|---|
| 小（8-32） | 慢 | 梯度噪声大，有正则效果 | 低 |
| 大（128-512） | 快 | 梯度更稳定，但可能过拟合 | 高 |

**经验值**：

- 表格数据：32-128
- 图像分类：64-256
- BERT 微调：16-32（大模型显存限制）
- 入门实验：先 32 跑通

**关键认知**：小 batch 不是"次品"。小 batch 的梯度噪声反而能帮模型跳出局部最优，起到类似正则化的效果。很多论文用 batch_size=32 就能调出好结果。

```python
# 看一个 epoch 有多少 batch
loader = DataLoader(dataset, batch_size=32)
print(len(loader))   # ceil(数据量 / 32)
```

---

## shuffle：训练集必须开

```python
# 训练集
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 测试集
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
```

**为什么训练集必须 shuffle？**

如果数据按类别排序（前 300 条都是猫，接着 300 条都是狗），不打乱的话，一个 batch 全是同一类，梯度方向极端，模型学崩。

**为什么测试集不 shuffle？** 为了结果可复现、能对照预测和真实标签的顺序。

---

## num_workers：并行加载提速

`num_workers=0` 意味着主进程串行加载数据——GPU 算完一个 batch 干等 CPU 准备下一个。

```python
# 慢：主进程单线程
loader = DataLoader(dataset, batch_size=32, num_workers=0)

# 快：4 个进程并行准备数据
loader = DataLoader(dataset, batch_size=32, num_workers=4)
```

| num_workers | 效果 | 注意 |
|---|---|---|
| 0 | 主进程加载，简单但慢 | 调试用 |
| 2-4 | 常用，速度和稳定平衡 | 图像任务推荐 |
| 8+ | 更快，但吃 CPU 和内存 | 可能触发系统限制 |

**经验**：从 2 开始试，观察 GPU 利用率。如果 GPU 利用率低（一直空等数据），加 num_workers。

**坑**：Windows 下 num_workers > 0 必须把训练代码放在 `if __name__ == '__main__':` 里，否则报多进程错误：

```python
if __name__ == '__main__':
    loader = DataLoader(dataset, batch_size=32, num_workers=4)
    for x, y in loader:
        ...
```

---

## pin_memory：GPU 训练加速

```python
loader = DataLoader(dataset, batch_size=32, pin_memory=True)
```

`pin_memory=True` 让数据放在"锁页内存"里，CPU 到 GPU 的传输更快。只用 GPU 训练时开，纯 CPU 训练没意义。

---

## drop_last：BatchNorm 的隐藏陷阱

```python
loader = DataLoader(dataset, batch_size=32, drop_last=True)
```

假设 1000 条数据，batch_size=32：`1000 / 32 = 31` 个完整 batch，最后剩 8 条。`drop_last=True` 丢掉这 8 条。

**为什么要丢？** 如果模型有 BatchNorm，最后那个只有 8 条的 batch 统计的均值方差和正常 32 条的不一样，可能导致评估不稳定。

**什么时候不丢？** 数据宝贵、不想浪费的时候。大多数情况 `drop_last=False` 也没问题。

---

## collate_fn：自定义 batch 拼接

默认 collate_fn 把多条数据按维度 0 拼起来。但如果你的数据是变长序列，就需要自定义。

```python
# 默认行为：等长数据拼接
# [x1, x2, x3] → torch.stack([x1, x2, x3])

# 变长序列需要 padding
def collate_fn(batch):
    # batch 是 [(x1, y1), (x2, y2), ...] 的列表
    texts = [item[0] for item in batch]
    labels = [item[1] for item in batch]
    # 找到最长的，padding 到等长
    max_len = max(len(t) for t in texts)
    padded = torch.zeros(len(texts), max_len)
    for i, t in enumerate(texts):
        padded[i, :len(t)] = t
    return padded, torch.tensor(labels)

loader = DataLoader(dataset, batch_size=32, collate_fn=collate_fn)
```

变长文本、变长序列任务必备。第 71 篇会专门讲 Padding 和 Mask。

---

## 完整使用模板

```python
from torch.utils.data import DataLoader

# 训练集：shuffle=True，多进程，锁页内存
train_loader = DataLoader(
    train_dataset,
    batch_size=64,
    shuffle=True,
    num_workers=4,
    pin_memory=True,
    drop_last=True,        # 有 BatchNorm 时建议开
)

# 测试集：shuffle=False，可以不开多进程
test_loader = DataLoader(
    test_dataset,
    batch_size=64,
    shuffle=False,
    num_workers=2,
    pin_memory=True,
)

# 训练循环
for epoch in range(epochs):
    for x, y in train_loader:
        # x: [B, ...], y: [B]
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
```

---

## 三个高频问题

### 问题 1：GPU 利用率低

**症状**：`nvidia-smi` 显示 GPU 利用率忽高忽低，大量时间在空等。

**排查**：num_workers 太小，数据加载跟不上 GPU 计算。加 num_workers。

### 问题 2：Windows 下多进程报错

```
RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase.
```

**修复**：把代码包在 `if __name__ == '__main__':` 里。

### 问题 3：最后一个 batch 报 BatchNorm 错误

**症状**：训练最后一步报 "Expected more than 1 value per channel"。

**原因**：BatchNorm 遇到 batch_size=1 的 batch 会报错。**修复**：`drop_last=True`。

---

## 课后练习

**练习 1**：10000 条数据，batch_size=128，一个 epoch 有多少个 batch？如果 drop_last=True 呢？

**练习 2**：下面配置哪里有问题？

```python
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=False, num_workers=0)
```

**练习 3**：如果你有一个变长文本 Dataset，每条返回 `(token_ids_tensor, label)`，token_ids 长度不一样。写出 collate_fn 让 DataLoader 能正常输出 batch。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：10000 / 128 = 78.125，所以 79 个 batch（最后一个只有 96 条）。drop_last=True 时 78 个完整 batch。

**练习 2**：两个问题。① 训练集 shuffle=False，数据如果不随机排列会导致同类别聚集在一个 batch。② num_workers=0 在图像任务中会很慢。改为 shuffle=True, num_workers=4。

**练习 3**：
```python
def collate_fn(batch):
    texts = [item[0] for item in batch]
    labels = [item[1] for item in batch]
    max_len = max(len(t) for t in texts)
    padded = torch.zeros(len(texts), max_len, dtype=texts[0].dtype)
    for i, t in enumerate(texts):
        padded[i, :len(t)] = t
    return padded, torch.tensor(labels)
```
</details>

---

## 核心要点小结

- batch_size 影响速度、梯度质量和显存——不是越大越好，32 是安全起点
- 训练集 shuffle=True 必开，测试集 shuffle=False
- num_workers 并行加速数据加载，从 2 开始试，GPU 空闲就加
- GPU 训练开 pin_memory=True
- 有 BatchNorm 时考虑 drop_last=True
- 变长数据用 collate_fn 自定义拼接，做 padding

下一篇我们深入模型本身——nn.Module 为什么是所有模型的基类，它到底帮你做了什么。
