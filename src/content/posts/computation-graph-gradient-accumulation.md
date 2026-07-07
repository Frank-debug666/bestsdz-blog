---
title: 计算图与梯度累积：为什么训练前必须清空梯度
description: 你写了 optimizer.zero_grad() 却不知道为什么要写。这一篇把 PyTorch 的动态计算图、叶子节点和梯度累积机制讲透，让你彻底明白"清梯度"不是仪式，是物理必然。
cover: /images/covers/computation-graph-gradient-accumulation-video.jpg
coverAlt: 第 45 课计算图与梯度累积视频封面，展示 loss、backward、grad 和 zero_grad 的训练链路。
pubDate: 2026-07-07T09:00:00+08:00
tags: [PyTorch, 计算图, 梯度累积, autograd, zero_grad]
---

你大概已经写过上百遍这三行：

```python
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

但如果我问你：为什么第一行非写不可？去掉会怎样？很多人会说"梯度会累积"——可梯度为什么是累积的，而不是覆盖的？这背后是 PyTorch 计算图的设计哲学。搞不懂它，你遇到"loss 突然变 NaN""训练前几步还好后面飞了"这类 bug，就只能瞎猜。

这一篇我们就把计算图、叶子节点和梯度累积彻底讲透。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/computation-graph-gradient-accumulation-video.jpg" aria-label="第 45 课：计算图与梯度累积">
    <source src="/videos/lesson-45-computation-graph-gradient-accumulation.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 45 课视频 - 计算图与梯度累积：为什么训练前必须清空梯度</figcaption>
</figure>

---

## 概念回顾：上一节我们讲了什么

第 44 篇我们讲了 `requires_grad` 和 `backward()`：当 `requires_grad=True` 时，PyTorch 会为这个 Tensor 的每个操作建计算图，`backward()` 沿着图反推梯度。今天我们往深走一步——这张图长什么样？`backward()` 之后它去哪了？梯度存在哪、怎么累加的？

---

## 一句话解释核心概念

> PyTorch 用**动态计算图**记录前向运算，`backward()` 沿图反向算梯度并**累加**到参数的 `.grad` 上，算完图就销毁——所以下一个 batch 要先 `zero_grad()` 清掉旧梯度，否则梯度会像滚雪球一样越滚越大。

---

## 动态计算图到底是什么

你在第 14 篇学过前向传播和反向传播。前向传播是"算结果"，反向传播是"沿原路算梯度"。问题是：反向传播怎么知道"原路"长什么样？

答案就是计算图——它把前向传播的每一步运算都记下来。

来看代码：

```python
import torch

# w 是模型参数（叶子节点），requires_grad=True
w = torch.tensor([2.0, 3.0], requires_grad=True)
# x 是输入数据，不需要梯度
x = torch.tensor([1.0, 2.0])

# 前向传播：每一步都被记录
y = (w * x).sum()   # y = 2*1 + 3*2 = 8

print(y.grad_fn)    # <SumBackward0 object at 0x...>
```

`y.grad_fn` 不是 None——这说明 PyTorch 给 `y` 挂了一个"反向传播函数"。这就是计算图在起作用。

### 关键术语

| 术语 | 含义 | 怎么认出它 |
|---|---|---|
| **叶子节点（leaf）** | 你直接创建的、不是算出来的 Tensor | `x.is_leaf == True` |
| **中间节点** | 由叶子节点运算产生的 Tensor | `grad_fn` 不为 None |
| **grad_fn** | 记录"这个 Tensor 是怎么算出来的" | 反向传播的路线图 |
| **动态图** | 每次前向传播现建图，`backward()` 后销毁 | 和 TensorFlow 1.x 的静态图对比 |

```python
w = torch.tensor([2.0], requires_grad=True)
print(w.is_leaf)        # True——直接创建，是叶子
print(w.grad_fn)        # None——叶子没有 grad_fn

y = w * 2
print(y.is_leaf)        # False——算出来的，不是叶子
print(y.grad_fn)        # <MulBackward0>
```

**为什么强调"叶子节点"？** 因为梯度只存在叶子节点的 `.grad` 里。中间节点的梯度用完就丢，不保留。

---

## 梯度累积：最坑也最重要的设计

现在来到这一篇的核心问题：**为什么梯度是累加的？**

PyTorch 的设计是：`backward()` 算出的梯度，不是覆盖到 `.grad`，而是**加到** `.grad` 上。

```python
w = torch.tensor([1.0], requires_grad=True)

# 第一次 backward
y1 = (w * 3).sum()
y1.backward()
print(w.grad)   # tensor([3.])  —— ∂y1/∂w = 3

# 第二次 backward，不清零
y2 = (w * 5).sum()
y2.backward()
print(w.grad)   # tensor([8.])  —— 3 + 5 = 8，累加了！
```

看到没？第二次的梯度 `5` 被加到了第一次的 `3` 上面，结果是 `8`，而不是覆盖成 `5`。

### 为什么 PyTorch 要这么设计

这其实不是 bug，是 feature。有些场景**需要**梯度累积：

- **显存不够，用小 batch 模拟大 batch**：做 4 次 batch_size=16 的前向反向，梯度累加 4 次，等价于 batch_size=64 的一次更新。
- **梯度累加训练**：在显存受限时模拟更大有效 batch size。

但日常训练里，每个 batch 应该独立计算梯度、独立更新参数。如果不清零，上一个 batch 的梯度会"污染"当前 batch，导致：

```
实际梯度 = 当前batch梯度 + 之前所有batch的梯度
```

这会让更新方向完全错乱，loss 飙升或变 NaN。

### 正确写法

```python
for x, y in train_loader:
    optimizer.zero_grad()     # ① 清空上一轮梯度
    logits = model(x)         # ② 前向传播（建图）
    loss = criterion(logits, y)
    loss.backward()           # ③ 反向传播（算梯度，图销毁）
    optimizer.step()          # ④ 用梯度更新参数
```

顺序记住：**清 → 前 → 算 → 更**。

---

## 计算图的生命周期：用完即弃

PyTorch 的图是**动态**的——每次前向传播现搭，`backward()` 一调用就拆。

```python
w = torch.tensor([1.0], requires_grad=True)
y = (w * 2).sum()

print(y.requires_grad)   # True
y.backward()

# backward 之后，图已销毁
# 再调用 backward 会报错
y.backward()   # RuntimeError: Trying to backward through the graph a second time
```

想多次 backward？得在前向时设 `retain_graph=True`：

```python
y = (w * 2).sum()
y.backward(retain_graph=True)   # 保留图
y.backward()                     # 第二次，这次之后图销毁
```

但日常训练不需要这个——每个 batch 都是全新的前向传播，建一张新图。

---

## 三个高频错误

### 错误 1：忘记 zero_grad

```python
# ❌ 不报错，但训练完全跑偏
for x, y in train_loader:
    logits = model(x)
    loss = criterion(logits, y)
    loss.backward()
    optimizer.step()
    # 梯度越累越大，几轮后 loss 爆炸
```

**症状**：前几个 epoch 还正常，突然 loss 变 NaN 或飞到天上。

### 错误 2：backward 之后还想用图

```python
loss.backward()
loss.backward()   # ❌ RuntimeError，图已经没了
```

**修复**：每个 batch 只 backward 一次。如果要算梯度又不想销毁图，用 `retain_graph=True`。

### 错误 3：评估时建图白费显存

```python
# ❌ 评估时还在建计算图
model.eval()
for x, y in test_loader:
    logits = model(x)        # 建了图，但根本不会 backward
    loss = criterion(logits, y)
    # 没调 backward，但图占着显存
```

**修复**：

```python
model.eval()
with torch.no_grad():        # ✅ 不建图，省显存提速度
    for x, y in test_loader:
        logits = model(x)
        loss = criterion(logits, y)
```

> 评估三件套：`model.eval()` + `torch.no_grad()` + 不调 `backward()`。

---

## detach()：从图里把数据"摘"出来

有时候你想拿到一个 Tensor 的值，但不想让它参与梯度计算。用 `detach()`：

```python
w = torch.tensor([1.0], requires_grad=True)
y = w * 2

# y 还在图里
y_detached = y.detach()
# y_detached 脱离了图，requires_grad=False

print(y_detached.requires_grad)   # False
print(y_detached.grad_fn)         # None
```

常见用途：打印 loss 时别让 loss 留在图里占显存：

```python
loss = criterion(logits, y)
print(loss.item())   # ✅ .item() 返回 Python float，自动脱离
# 或者
print(loss.detach())  # ✅ 显式脱离
```

---

## 课后练习

**练习 1**：下面这段代码运行后 `w.grad` 是多少？先猜再跑。

```python
w = torch.tensor([1.0], requires_grad=True)
for i in range(5):
    y = (w * (i + 1)).sum()
    y.backward()
print(w.grad)
```

**练习 2**：如果训练循环里把 `optimizer.zero_grad()` 移到 `optimizer.step()` 后面（而不是最前面），训练还能正常进行吗？为什么？

**练习 3**：下面代码哪里有问题？怎么改？

```python
model.eval()
for x, y in test_loader:
    logits = model(x)
    preds = torch.argmax(logits, dim=1)
    acc = (preds == y).float().mean()
    acc.backward()
```

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：每次 backward 累加，梯度依次是 1+2+3+4+5=15。结果 `tensor([15.])`。这就是梯度累积的直观体现——不清零就会一直加。

**练习 2**：能正常训练。关键在于"每个 batch 更新前梯度是干净的"。放在 `step()` 后面等于"为下一个 batch 清零"，效果一样。但放在最前面是更常见的写法，因为语义更清晰：先清空，再用。如果放在 step 后面，第一个 batch 开始前没有清零（初始 grad 是 None，PyTorch 第一次 backward 时视为 0，所以第一个 batch 没问题），后续 batch 都能正常清零。

**练习 3**：两个问题。① 评估时不应该调 `backward()`，这里不需要梯度，白建图白算梯度，浪费显存。② `acc` 是评估指标，不是 loss，反向传播它毫无意义。改成：
```python
model.eval()
with torch.no_grad():
    for x, y in test_loader:
        logits = model(x)
        preds = torch.argmax(logits, dim=1)
        acc = (preds == y).float().mean()
```
</details>

---

## 核心要点小结

- PyTorch 用**动态计算图**记录前向运算，`backward()` 后图自动销毁
- **叶子节点**才有 `.grad`，中间节点的梯度用完即弃
- 梯度是**累加**的——不清零就会和上一轮的梯度叠加，导致训练崩溃
- 训练四步：**清 → 前 → 算 → 更**（zero_grad → forward → backward → step）
- 评估时用 `torch.no_grad()` 避免建图，`detach()` 把 Tensor 从图中摘出来

下一篇我们聊 Shape——深度学习里最容易报错、也最重要的"数据契约"。你以为写错了维度只是报错，其实 Shape 错了模型可能"不报错但学废"。
