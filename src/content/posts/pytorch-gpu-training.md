---
title: "PyTorch GPU 训练：模型和数据如何放到同一设备"
description: 'RuntimeError: Expected all tensors to be on the same device —— 这是你用 GPU 训练时最常遇到的报错。模型在 GPU、数据在 CPU，它们碰不到一起。这篇讲清设备迁移的完整流程。'
cover: /images/covers/pytorch-gpu-training-video.jpg
coverAlt: 第 56 课 PyTorch GPU 训练视频封面，展示 device、cuda、模型迁移、数据迁移和同设备原则。
pubDate: 2026-07-22T09:40:00+08:00
tags: [PyTorch, GPU, CUDA, device, 设备迁移]
---

你兴致勃勃地换了张 GPU，准备体验十倍加速。结果一跑代码：

```
RuntimeError: Expected all tensors to be on the same device, but found at least two devices, cuda:0 and cpu!
```

模型在 GPU 上，数据还在 CPU 上——它们没法直接运算。这就是 GPU 训练最常踩的第一个坑：设备不一致。

这篇把模型、数据、损失函数怎么统一到同一设备讲清楚。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-gpu-training-video.jpg" aria-label="第 56 课：PyTorch GPU 训练">
    <source src="/videos/lesson-56-pytorch-gpu-training.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 56 课视频 - PyTorch GPU 训练：模型和数据如何放到同一设备</figcaption>
</figure>

---

## 概念回顾

前面几篇我们都在 CPU 上训练。第 43 篇提到 Tensor 有 `device` 属性。今天我们把整个训练流程搬到 GPU 上。第 50 篇讲过 `model.to(device)` 能迁移模型参数——今天展开讲数据也要一起搬。

---

## 一句话解释

> GPU 训练的原则：模型、输入数据、标签必须在同一个设备上。用 `.to('cuda')` 把它们搬过去，缺一不可。

---

## 检查 GPU 是否可用

```python
import torch

print(torch.cuda.is_available())    # True 表示有可用 GPU
print(torch.cuda.device_count())     # GPU 数量
print(torch.cuda.get_device_name(0)) # GPU 名称
```

设一个通用 device 变量，让代码在有无 GPU 时都能跑：

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"使用设备: {device}")
```

---

## 三样东西必须搬到 GPU

### 1. 模型

```python
model = MyModel()
model = model.to(device)   # 模型参数迁移到 GPU
```

### 2. 输入数据

```python
for x, y in train_loader:
    x = x.to(device)   # 输入数据迁移
    y = y.to(device)   # 标签也要迁移
    ...
```

### 3. 损失函数（大多数情况自动处理）

`CrossEntropyLoss`、`MSELoss` 等标准损失函数没有可学习参数，不需要显式迁移。但如果有自定义的带参数的 loss，也要 `.to(device)`。

---

## 完整 GPU 训练模板

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# 1. 设备
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 2. 数据
train_dataset = MyDataset(...)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True,
                          num_workers=4, pin_memory=True)   # pin_memory 加速

# 3. 模型迁移
model = MyModel().to(device)

# 4. 损失和优化器
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 5. 训练循环
for epoch in range(epochs):
    model.train()
    for x, y in train_loader:
        x = x.to(device)        # ⚠️ 数据迁移
        y = y.to(device)        # ⚠️ 标签迁移

        optimizer.zero_grad()
        logits = model(x)       # 模型和数据都在 GPU
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
```

---

## 常见报错与解决

### 报错 1：模型和数据不在同一设备

```
RuntimeError: Expected all tensors to be on the same device
```

**排查**：检查模型和数据的 device。

```python
print(next(model.parameters()).device)   # 模型在哪
print(x.device)                           # 数据在哪
```

两者必须一致。**修复**：确保都 `.to(device)`。

### 报错 2：评估时忘记迁移数据

```python
# ❌ 训练时迁移了，评估时忘了
model.eval()
with torch.no_grad():
    for x, y in test_loader:
        # x 还在 CPU！
        logits = model(x)   # 报错：模型在 GPU，数据在 CPU
```

**修复**：评估时也要迁移。

```python
model.eval()
with torch.no_grad():
    for x, y in test_loader:
        x = x.to(device)
        y = y.to(device)
        logits = model(x)
```

### 报错 3：保存的模型加载后设备不对

```python
# 保存时在 GPU
torch.save(model.state_dict(), 'model.pth')

# 加载到 CPU 的机器上
model.load_state_dict(torch.load('model.pth'))
# 报错：模型参数在 cuda:0，但当前机器没 GPU
```

**修复**：加载时指定 `map_location`。

```python
model.load_state_dict(torch.load('model.pth', map_location='cpu'))
```

---

## GPU 训练的加速技巧

### 1. pin_memory=True

```python
DataLoader(dataset, pin_memory=True)
```

让数据放在锁页内存里，CPU→GPU 传输更快。GPU 训练必开。

### 2. num_workers > 0

```python
DataLoader(dataset, num_workers=4)
```

多进程预加载数据，让 GPU 不空等。上一篇讲过。

### 3. 检查 GPU 利用率

```bash
nvidia-smi
```

如果 GPU 利用率很低（<30%），说明数据加载太慢，GPU 在空等。加 `num_workers`。

### 4. 混合精度训练（进阶）

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for x, y in train_loader:
    x, y = x.to(device), y.to(device)
    optimizer.zero_grad()
    with autocast():                    # 自动混合精度
        logits = model(x)
        loss = criterion(logits, y)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

用 float16 加速，显存减半，速度提升 1.5-2 倍。大模型训练必备，入门可不用。

---

## 三个高频错误

### 错误 1：只迁移模型不迁移数据

```python
model = model.to(device)
# 忘了 x.to(device)
logits = model(x)   # 报错
```

### 错误 2：在 GPU 上创建 Tensor 时用了 CPU 的默认

```python
# ❌ 数据在 CPU
x = torch.randn(32, 10)
model = model.to('cuda')
model(x)   # 报错

# ✅ 创建时就指定设备
x = torch.randn(32, 10, device='cuda')
```

### 错误 3：OOM（显存不足）

```
RuntimeError: CUDA out of memory
```

**排查**：batch_size 太大、模型太大、显存泄漏。

**修复**：减小 batch_size；用 `torch.cuda.empty_cache()` 清缓存；检查评估时是否忘 `torch.no_grad()`。

---

## 课后练习

**练习 1**：写一个函数 `train_one_epoch`，接收模型、数据加载器、设备，在 GPU 上训练一个 epoch。

**练习 2**：下面代码哪里有问题？

```python
device = 'cuda'
model = model.to(device)
for x, y in loader:
    logits = model(x)
    loss = criterion(logits, y)
```

**练习 3**：训练时报 "CUDA out of memory"，列出三个可能的修复方案。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
```python
def train_one_epoch(model, loader, device, optimizer, criterion):
    model.train()
    for x, y in loader:
        x = x.to(device)
        y = y.to(device)
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
```

**练习 2**：数据 x 和 y 没有迁移到 device。修复：
```python
for x, y in loader:
    x = x.to(device)
    y = y.to(device)
    logits = model(x)
    loss = criterion(logits, y)
```

**练习 3**：
1. 减小 batch_size（如 64 → 32）
2. 评估时加 `with torch.no_grad()`，不保留计算图
3. 调用 `torch.cuda.empty_cache()` 清理显存碎片
4. 如果是模型太大，考虑用更小的模型或混合精度训练
</details>

---

## 核心要点小结

- GPU 训练三统一：模型、输入、标签必须在同一设备
- 用 `device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')` 兼容有无 GPU
- `model.to(device)` 迁移模型，`x.to(device)` 迁移数据
- 评估时也要迁移数据，别忘了
- GPU 训练开 `pin_memory=True` 和 `num_workers>0` 加速
- OOM 先减 batch_size，评估加 `torch.no_grad()`
- 跨设备加载模型用 `map_location='cpu'`

下一篇讲正则化——Dropout、Early Stopping，怎么让模型不"死记硬背"。
