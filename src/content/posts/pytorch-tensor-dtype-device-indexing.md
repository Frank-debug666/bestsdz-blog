---
title: Tensor 进阶：dtype、device、索引和切片
description: 补齐 PyTorch 实际训练中最常用的 Tensor 操作：数据类型、设备迁移、索引、切片和布尔筛选。
cover: /images/covers/pytorch-tensor-dtype-device-indexing-video.jpg
coverAlt: PyTorch Tensor 进阶课程视频封面，展示 dtype、device、索引、切片和布尔筛选。
pubDate: 2026-07-04T11:00:00+08:00
tags: [PyTorch, Tensor, dtype, device, 深度学习]
---

前面我们已经知道 Tensor 是 PyTorch 里最核心的数据对象。

但真实训练时，只知道 Tensor 是“多维数组”还不够。你还会经常遇到这些问题：

- 为什么模型报 dtype 不匹配；
- 为什么数据在 CPU，模型在 GPU；
- 怎样取出某几行、某几列；
- 怎样用布尔条件筛选样本；
- 为什么分类标签要是 `long` 类型。

这一课补齐 Tensor 的几个高频操作。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-tensor-dtype-device-indexing-video.jpg" aria-label="第 43 课：Tensor 进阶操作">
    <source src="/videos/lesson-43a-pytorch-tensor-dtype-device-indexing.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 43 课视频 - Tensor 进阶：dtype、device、索引和切片</figcaption>
</figure>

## dtype 是什么

`dtype` 表示 Tensor 里面元素的数据类型。

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
print(x.dtype)
```

常见类型包括：

| dtype | 常见用途 |
| --- | --- |
| `torch.float32` | 模型输入、权重、浮点计算 |
| `torch.float64` | 更高精度浮点，训练里不常默认使用 |
| `torch.int64` / `torch.long` | 分类标签、索引 |
| `torch.bool` | 布尔条件筛选 |

PyTorch 训练中最常见的是：输入特征用 `float32`，分类标签用 `long`。

## dtype 不匹配为什么会报错

例如分类任务：

```python
loss_fn = torch.nn.CrossEntropyLoss()
```

它要求：

- 模型输出 logits 通常是 `float32`；
- 标签 y 必须是类别编号，并且是 `long` 类型。

如果标签是浮点数：

```python
y = torch.tensor([0.0, 1.0, 2.0])
```

就可能报错。

应该写成：

```python
y = torch.tensor([0, 1, 2], dtype=torch.long)
```

或者：

```python
y = y.long()
```

## 类型转换

常见转换方式：

```python
x = x.float()
y = y.long()
mask = mask.bool()
```

也可以用：

```python
x = x.to(torch.float32)
```

初学阶段先记住：

```text
输入特征：float
分类标签：long
判断条件：bool
```

## device 是什么

`device` 表示 Tensor 在哪里计算。

常见设备：

```text
cpu
cuda
```

查看设备：

```python
x = torch.tensor([1, 2, 3])
print(x.device)
```

如果有 NVIDIA GPU，并且 PyTorch 安装了 CUDA 版本，可以使用：

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

## 数据和模型必须在同一设备

训练时常见错误：

```text
Expected all tensors to be on the same device
```

意思是：模型在 GPU，但数据还在 CPU，或者反过来。

正确做法：

```python
model = model.to(device)

for x, y in dataloader:
    x = x.to(device)
    y = y.to(device)
    pred = model(x)
```

模型、输入、标签要放在同一个设备上。

## 基础索引

Tensor 的索引和 NumPy 很像。

```python
x = torch.tensor([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
])

print(x[0])      # 第一行
print(x[0, 1])   # 第一行第二列
print(x[:, 0])   # 第一列
print(x[1:, :2]) # 第 2 行开始，取前 2 列
```

索引时先看 shape，再看你要取哪个维度。

## 切片和 batch

深度学习里第一维通常是 batch。

如果：

```python
x.shape == torch.Size([32, 10])
```

通常表示：

```text
32 个样本
每个样本 10 个特征
```

取前 5 个样本：

```python
x[:5]
```

取所有样本的第 2 个特征：

```python
x[:, 1]
```

不要把 batch 维和特征维弄反，这是很多 shape 错误的来源。

## 布尔筛选

布尔 Tensor 可以用来筛选数据：

```python
x = torch.tensor([1, 5, 2, 8, 3])
mask = x > 3

print(mask)
print(x[mask])
```

输出会保留满足条件的元素。

在训练分析里，可以用它筛选某一类样本：

```python
correct = pred == y
wrong_x = x[~correct]
wrong_y = y[~correct]
```

这对错误样本分析很有用。

## gather 和 argmax 的直觉

分类任务里经常用 `argmax` 取预测类别：

```python
logits = model(x)
pred = logits.argmax(dim=1)
```

如果 `logits.shape` 是 `[batch_size, num_classes]`，那么 `dim=1` 表示在类别维度上找最大值。

例如：

```text
每一行是一个样本
每一列是一个类别分数
```

所以分类预测通常是 `argmax(dim=1)`。

## detach 和 numpy

如果 Tensor 需要梯度，直接转 NumPy 可能报错。

常见写法：

```python
arr = x.detach().cpu().numpy()
```

含义是：

1. `detach()`：从计算图里分离；
2. `cpu()`：移回 CPU；
3. `numpy()`：转成 NumPy 数组。

验证和可视化阶段经常用到这套写法。

## 一个小练习

看下面代码：

```python
logits = torch.tensor([
    [1.2, 0.3, 2.1],
    [0.2, 3.4, 1.1],
])

pred = logits.argmax(dim=1)
print(pred)
```

第一行最大值在第 2 个索引，第二行最大值在第 1 个索引，所以输出是：

```text
tensor([2, 1])
```

这就是分类模型从 logits 得到预测类别的过程。

## 常见错误

### 标签 dtype 用错

`CrossEntropyLoss` 的标签要是类别编号，不是 one-hot，也不是 float。

### 设备不一致

模型在 GPU，输入在 CPU，会直接报错。

### dim 写错

`argmax(dim=0)` 和 `argmax(dim=1)` 含义完全不同。分类任务里通常按类别维度取最大值。

### 忘记 detach

训练中的 Tensor 带计算图，做日志或可视化时要先 `detach()`。

## 这一课先记住

Tensor 进阶先掌握四件事：

```text
dtype：数据是什么类型
device：数据在哪里计算
索引切片：怎样取出想要的部分
布尔筛选：怎样分析满足条件的样本
```

下一课继续看自动微分背后的计算图，理解为什么 `backward()` 能把梯度自动算出来。
