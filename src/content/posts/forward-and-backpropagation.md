---
title: 前向传播与反向传播到底在做什么？
description: 用“预测、算错、追责、更新”串起一次神经网络训练，并用最小 PyTorch 代码看清 forward、backward 和 step 的分工。
pubDate: 2026-06-21T09:00:00+08:00
tags: [深度学习, 神经网络, 反向传播, PyTorch]
---

训练神经网络时，我们经常看到下面几行代码：

```python
logits = model(x)
loss = loss_fn(logits, y)
loss.backward()
optimizer.step()
```

它们看起来只是四次函数调用，背后却完成了一次完整的学习：**先根据现有参数作出预测，再计算错误，把错误逐层传回每个参数，最后调整参数。**

可以先把这条主线记成四个词：

```text
预测 → 算错 → 追责 → 更新
```

## 前向传播：用当前参数作一次预测

前向传播是数据从输入端流向输出端的过程。

假设一个网络由两层全连接层组成：

```text
输入特征 x
→ Linear(2, 4)
→ ReLU
→ Linear(4, 1)
→ 预测值
```

每一层读取上一层的输出，用自己的权重和偏置完成计算，再把结果交给下一层。执行：

```python
prediction = model(x)
```

就是在进行一次前向传播。此时模型只是用当前参数回答问题，参数还没有发生变化。

前向传播会保留计算过程中必要的关系。例如某个输出由哪些输入、权重和中间结果得到。这些关系会组成后续反向传播需要的计算图。

## 损失函数：把预测变成一个错误分数

模型给出预测后，需要和真实答案比较：

```python
loss = loss_fn(prediction, target)
```

损失函数把整批样本的预测误差汇总成一个标量。这个数不只是用来显示训练效果，它还是反向传播的起点。

如果没有损失，就不知道模型要朝什么方向调整。损失越小，通常说明当前预测越接近训练目标。

## 反向传播：计算每个参数对错误负多少责任

调用：

```python
loss.backward()
```

并不会直接修改参数。它做的是计算梯度。

梯度回答的问题是：

> 某个参数稍微增大一点，损失会增大还是减小？变化有多明显？

神经网络有很多层，损失位于网络末端。反向传播会从损失开始，沿着前向传播留下的计算关系反方向逐层计算：

```text
损失
→ 输出层参数的梯度
→ 隐藏层参数的梯度
→ 更前面各层参数的梯度
```

这背后的数学工具是链式法则。可以把它理解成一次逐级追责：最终结果出了问题，就从最后一步开始，向前判断每一步对结果造成了多大影响。

反向传播结束后，梯度通常保存在参数的 `.grad` 中：

```python
for name, parameter in model.named_parameters():
    print(name, parameter.grad)
```

## 优化器更新：真正修改参数

知道每个参数的梯度以后，优化器才会执行更新：

```python
optimizer.step()
```

最简单的更新可以写成：

```text
新参数 = 旧参数 - 学习率 × 梯度
```

梯度给出调整方向，学习率控制每次调整的幅度。`loss.backward()` 负责算梯度，`optimizer.step()` 负责改参数，两者不能混为一谈。

## 用最小 PyTorch 代码跑通一次更新

下面的例子用两个输入特征预测一个连续数值：

```python
import torch
from torch import nn

torch.manual_seed(7)

model = nn.Sequential(
    nn.Linear(2, 4),
    nn.ReLU(),
    nn.Linear(4, 1),
)

x = torch.tensor([
    [1.0, 2.0],
    [2.0, 1.0],
    [3.0, 4.0],
])
y = torch.tensor([[3.0], [3.0], [7.0]])

loss_fn = nn.MSELoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

optimizer.zero_grad()      # 清空上一次留下的梯度
prediction = model(x)      # 前向传播：作出预测
loss = loss_fn(prediction, y)
loss.backward()            # 反向传播：计算梯度
optimizer.step()           # 根据梯度更新参数

print("loss:", loss.item())
```

这段代码只完成一次参数更新。真正训练时，会对许多 batch 重复同一套顺序。

## 为什么要先清空梯度

PyTorch 默认会累加梯度。如果连续调用两次 `backward()`，第二次计算的梯度会加到第一次的结果上。

普通训练循环通常需要在每次更新前执行：

```python
optimizer.zero_grad()
```

否则当前 batch 和之前 batch 的梯度会混在一起，更新幅度也会偏离预期。梯度累加确实有用途，但应该是明确设计的训练策略，而不是忘记清空造成的意外。

## 三个高频误区

### 1. 以为 `backward()` 会更新参数

`backward()` 只计算并保存梯度。没有 `optimizer.step()`，模型参数不会改变。

### 2. 把训练顺序写乱

常规顺序应该是：

```text
zero_grad → forward → loss → backward → step
```

先 `step()` 再 `backward()`，优化器就拿不到这一次预测产生的梯度。

### 3. 在验证和推理时仍然记录梯度

验证阶段不需要反向传播，通常应写成：

```python
model.eval()
with torch.no_grad():
    prediction = model(x)
```

这样可以减少不必要的计算与内存占用。

## 这一课先记住什么

一次训练更新可以拆成四个职责清楚的步骤：

1. 前向传播根据当前参数产生预测；
2. 损失函数衡量预测与答案的差距；
3. 反向传播计算每个参数的梯度；
4. 优化器根据梯度真正修改参数。

下一课继续进入 PyTorch 的自动微分与计算图，解释 `loss.backward()` 为什么能自动找到并计算这些梯度。
