---
title: 一个 PyTorch 模型训练的完整流程
description: 从准备数据、定义模型、选择损失函数和优化器，到训练循环和验证评估，把 PyTorch 训练主线串起来。
cover: /images/covers/pytorch-training-flow.png
coverAlt: 一组训练流程节点从数据、模型、损失函数连接到优化器，屏幕上有训练曲线。
pubDate: 2026-06-17T14:40:00+08:00
tags: [PyTorch, 模型训练, 项目实战]
---

学 PyTorch 时，单个概念看懂不难，真正容易乱的是完整训练流程。

这篇文章先不追求复杂模型，只把一条最基础的训练主线串起来。


<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-training-flow-video.jpg" aria-label="第 18 课：PyTorch 模型训练完整流程">
    <source src="/videos/lesson-18-pytorch-training-flow.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 18 课视频 · PyTorch 模型训练完整流程（约 1 分 42 秒）</figcaption>
</figure>

## 第一步：准备数据

训练模型前，先要把数据整理成模型能吃的形式。

通常会经历几步：

- 读取原始数据
- 做必要的清洗和预处理
- 转成 Tensor
- 封装成 Dataset
- 用 DataLoader 批量加载

如果数据这一步没处理好，后面模型再复杂也很难救回来。

## 第二步：定义模型

PyTorch 里通常会继承 `nn.Module` 定义模型：

```python
from torch import nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(10, 2)

    def forward(self, x):
        return self.linear(x)
```

这里 `__init__` 定义模型有哪些层，`forward` 定义数据怎么流过这些层。

## 第三步：选择损失函数

损失函数负责衡量模型预测错了多少。

分类任务常见：

```python
loss_fn = nn.CrossEntropyLoss()
```

回归任务常见：

```python
loss_fn = nn.MSELoss()
```

损失函数要和任务类型匹配，这一点很重要。

## 第四步：选择优化器

优化器负责根据梯度更新参数。

常见写法：

```python
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
```

这里 `model.parameters()` 告诉优化器要更新哪些参数，`lr` 是学习率。

## 第五步：训练循环

最核心的训练循环通常长这样：

```python
for x, y in train_loader:
    pred = model(x)
    loss = loss_fn(pred, y)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

这几行非常重要。

可以按顺序理解：

1. 前向传播，得到预测
2. 计算 loss
3. 清空旧梯度
4. 反向传播，计算新梯度
5. 优化器更新参数

这就是 PyTorch 训练模型的核心骨架。

## 第六步：验证模型

训练时还需要在验证集上观察效果。

验证阶段通常不需要计算梯度，所以会写：

```python
model.eval()
with torch.no_grad():
    for x, y in val_loader:
        pred = model(x)
```

这样可以减少显存占用，也避免误更新模型。

## 小结

一个 PyTorch 训练流程可以压缩成这样：

```text
数据 -> 模型 -> loss -> backward -> optimizer.step -> 验证
```

刚开始不要急着堆复杂结构。

先把这条主线真正跑通，后面再换模型、调参数、加可视化，都会轻松很多。
