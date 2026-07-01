---
title: PyTorch 自动微分是什么？理解 requires_grad 和 backward
description: 从一个最小例子理解 PyTorch 如何记录计算过程、自动求梯度，以及为什么训练前要清空梯度。
cover: /images/covers/pytorch-autograd-requires-grad-backward-video.jpg
coverAlt: PyTorch 计算图从参数和输入连接到损失函数，再通过 backward 返回梯度。
pubDate: 2026-07-01T09:40:00+08:00
tags: [PyTorch, 自动微分, Tensor, 反向传播, 深度学习]
---

前面我们已经写过 PyTorch 的训练流程：前向计算、损失函数、反向传播、优化器更新。

但很多初学者第一次看到：

```python
loss.backward()
optimizer.step()
```

会觉得像魔法。为什么调用一次 `backward()`，参数上就有梯度了？

这一课先把 PyTorch 自动微分讲清楚。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-autograd-requires-grad-backward-video.jpg" aria-label="第 44 课：PyTorch 自动微分">
    <source src="/videos/lesson-44-pytorch-autograd-requires-grad-backward.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 44 课视频 · PyTorch 自动微分是什么？理解 requires_grad 和 backward</figcaption>
</figure>

## 自动微分解决什么问题

训练神经网络，本质上是在回答一个问题：

```text
如果损失变大了，应该怎么调整每个参数？
```

这个“怎么调整”就需要梯度。

手动推导一个很小的函数还可以，但真实神经网络有成千上万个参数。如果每个参数的梯度都手写，几乎不可能维护。

PyTorch 的 autograd 会自动记录计算过程，并在需要时帮我们反向求梯度。

## requires_grad 是什么

先看一个最小例子：

```python
import torch

w = torch.tensor(2.0, requires_grad=True)
x = torch.tensor(3.0)

y = w * x
```

这里 `w.requires_grad=True` 的意思是：请 PyTorch 跟踪与 `w` 有关的计算，将来我要对它求梯度。

`x` 没有设置 `requires_grad=True`，说明它只是普通输入，不需要为它保存梯度。

## backward 会做什么

继续上面的例子：

```python
y.backward()

print(w.grad)
```

因为：

```text
y = w * x
```

当 `x = 3` 时，`y` 对 `w` 的梯度就是 3。

所以 `w.grad` 会得到：

```text
tensor(3.)
```

你可以把 `backward()` 理解成：从最终结果往前走，把每个需要梯度的 Tensor 对结果的影响算出来。

## 计算图是什么

当你写：

```python
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)
x = torch.tensor(3.0)

y = w * x + b
loss = (y - 10) ** 2
```

PyTorch 会在背后记录一张计算图：

```text
w, x -> 乘法 -> 加 b -> y -> loss
```

这张图不是你手动画出来的，而是 PyTorch 在执行运算时动态记录的。

当你调用：

```python
loss.backward()
```

它就会沿着这张图反向传播，把梯度累积到 `w.grad` 和 `b.grad` 里。

## loss 通常要是标量

最常见的训练代码里，`loss` 是一个标量：

```python
loss = loss_fn(pred, y)
loss.backward()
```

如果你的输出不是标量，直接 backward 可能会报错，因为 PyTorch 不知道你想对哪个方向求导。

初学阶段先记住：训练时通常对一个标量 loss 调用 `backward()`。

## 梯度会累积

PyTorch 的梯度默认是累积的：

```python
loss.backward()
loss.backward()
```

如果连续调用两次，`grad` 会叠加，而不是自动清零。

所以训练循环里通常会写：

```python
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

顺序很重要：

1. `zero_grad()` 清空上一轮梯度；
2. `backward()` 计算这一轮梯度；
3. `step()` 根据梯度更新参数。

## no_grad 用在什么时候

验证或预测阶段不需要更新参数，也就不需要记录计算图：

```python
model.eval()

with torch.no_grad():
    pred = model(x)
```

`torch.no_grad()` 可以减少内存占用，也能避免误把预测阶段的计算加入梯度图。

训练阶段需要梯度，验证和推理阶段通常不需要梯度。

## 一个完整小例子

```python
import torch

w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)
x = torch.tensor(3.0)
target = torch.tensor(10.0)

pred = w * x + b
loss = (pred - target) ** 2

loss.backward()

print("w.grad:", w.grad)
print("b.grad:", b.grad)
```

这个例子虽然简单，但它和神经网络训练的核心逻辑是一样的：

```text
参数参与前向计算
  -> 得到预测
  -> 计算 loss
  -> backward 求梯度
  -> optimizer 更新参数
```

## 这一课先记住

PyTorch 自动微分可以先抓住四句话：

1. `requires_grad=True` 表示这个 Tensor 需要被求梯度；
2. PyTorch 会动态记录计算图；
3. `backward()` 会沿计算图反向计算梯度；
4. 梯度会累积，所以训练前要 `zero_grad()`。

下一课我们继续看计算图，理解为什么 PyTorch 能把复杂模型里的梯度自动串起来。
