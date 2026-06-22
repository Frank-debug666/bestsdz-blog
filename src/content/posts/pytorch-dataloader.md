---
title: DataLoader 详解：批量读取、打乱、并行加载有什么用
description: DataLoader 负责把数据按批次送进模型，并处理 shuffle、batch size 和多进程加载等训练细节。
cover: /images/covers/pytorch-dataloader.png
coverAlt: 多张数据卡片被整理成批次，旁边屏幕显示抽象的数据加载队列。
pubDate: 2026-06-17T14:50:00+08:00
tags: [PyTorch, DataLoader, 数据加载]
---

训练模型时，我们通常不会一次把全部数据都塞进模型。

更常见的做法是：每次拿一小批数据训练一次。

在 PyTorch 里，负责这件事的就是 `DataLoader`。


<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-dataloader-video.jpg" aria-label="第 17 课：DataLoader 详解">
    <source src="/videos/lesson-17-pytorch-dataloader.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 17 课视频 · DataLoader 详解（约 1 分 37 秒）</figcaption>
</figure>

## DataLoader 是什么

`DataLoader` 可以理解成数据搬运工。

它会从 Dataset 里取数据，然后按批次打包好，送给训练循环。

最常见的写法是：

```python
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,
    batch_size=32,
    shuffle=True,
)
```

训练时就可以这样用：

```python
for x, y in loader:
    pred = model(x)
```

## batch_size 是什么

`batch_size` 表示每次送进模型多少个样本。

如果 batch size 是 32，就表示模型每次看 32 条数据，然后计算一次 loss，再更新参数。

batch size 太小，训练会更抖；batch size 太大，占用显存更多，也可能影响泛化。

入门阶段可以先从 32 或 64 这类常见值开始。

## shuffle 有什么用

`shuffle=True` 表示每个 epoch 开始时打乱数据顺序。

这样做是为了避免模型记住数据的固定顺序。

比如数据前半部分全是类别 A，后半部分全是类别 B，如果不打乱，训练过程就可能很不稳定。

所以训练集一般会开启 shuffle。

但验证集和测试集通常不需要打乱，因为我们只是评估模型效果。

## num_workers 是什么

`num_workers` 表示用几个子进程加载数据。

如果数据读取、图片预处理比较慢，可以适当增加它，让 CPU 提前准备数据，减少 GPU 等数据的时间。

不过在 Windows 或小项目里，刚开始可以先用默认值。

等训练真的被数据加载拖慢，再考虑调整。

## DataLoader 和 Dataset 的关系

Dataset 负责定义“单条数据怎么取”。

DataLoader 负责定义“怎么批量取、要不要打乱、怎么并行加载”。

可以这样记：

```text
Dataset 管单个样本
DataLoader 管一批样本
```

这两个配合起来，训练循环才会干净。

## 小结

DataLoader 不直接训练模型，但它决定数据怎样进入模型。

理解 `batch_size`、`shuffle` 和 `num_workers`，基本就能读懂大多数 PyTorch 入门训练代码。
