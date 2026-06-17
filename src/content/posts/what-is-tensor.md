---
title: Tensor 是什么？PyTorch 里最重要的对象讲清楚
description: Tensor 可以理解成更通用的数组，它承载数据、参数和梯度，是 PyTorch 训练流程的基础。
cover: /images/covers/what-is-tensor.png
coverAlt: 笔记本上画着方格矩阵，屏幕里显示抽象的张量和柱状图。
pubDate: 2026-06-17T15:10:00+08:00
tags: [PyTorch, Tensor, AI基础]
---

学 PyTorch 时，第一个绕不开的概念就是 `Tensor`。

很多人会把它翻译成“张量”，这个词听起来有点硬。但从代码角度看，可以先把 Tensor 理解成更通用的数组。

它可以是一组数字，也可以是一张表，还可以是一批图片。

## 从数字到 Tensor

一个普通数字可以看成 0 维 Tensor：

```python
import torch

x = torch.tensor(3.0)
```

一组数字可以看成 1 维 Tensor：

```python
x = torch.tensor([1.0, 2.0, 3.0])
```

一个矩阵可以看成 2 维 Tensor：

```python
x = torch.tensor([
    [1.0, 2.0],
    [3.0, 4.0],
])
```

如果是一批图片，维度可能更多，比如：

```text
[batch, channel, height, width]
```

这就是深度学习里常见的四维 Tensor。

## Tensor 为什么重要

在 PyTorch 里，几乎所有东西都会变成 Tensor。

训练数据是 Tensor，模型参数是 Tensor，中间计算结果是 Tensor，梯度也是 Tensor。

如果你理解了 Tensor 的形状和流动方式，很多模型代码就会清楚很多。

## shape 是第一重点

看 Tensor 时，最重要的是看它的 `shape`。

比如：

```python
x = torch.randn(32, 784)
print(x.shape)
```

这里的 `32` 通常表示 batch size，`784` 可能表示每个样本的特征数量。

很多 PyTorch 报错，本质上都是 shape 对不上。

比如 Linear 层期待输入是 `[batch, in_features]`，但你传进去的是别的形状，就会报维度错误。

## Tensor 和 NumPy 有点像

如果你学过 NumPy，会发现 Tensor 和 `ndarray` 很像。

它们都可以做矩阵计算、切片、广播、变形。

但 PyTorch Tensor 有两个特别重要的能力：

- 可以放到 GPU 上计算
- 可以记录梯度，支持自动求导

这也是它能用于深度学习训练的关键。

## 常见操作

几个入门阶段最常用的操作：

```python
x = torch.randn(2, 3)

x.shape
x.reshape(3, 2)
x.to("cuda")
x.float()
x.mean()
x.sum()
```

这些操作不需要一次性背完，但要慢慢熟悉。

尤其是 `reshape`、`to(device)`、`float()`，在训练代码里非常常见。

## 小结

Tensor 是 PyTorch 的基础数据对象。

先别被“张量”这个名字吓到。你可以把它理解成可以参与深度学习计算的多维数组。

学 PyTorch 时，多看 shape，多跟踪数据从输入到模型输出的变化，很多问题都会变得清楚。
