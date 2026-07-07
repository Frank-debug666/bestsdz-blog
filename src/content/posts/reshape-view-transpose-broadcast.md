---
title: reshape、view、transpose 和广播机制怎么选：张量形状转换实战
description: reshape 和 view 看起来一样，transpose 和 permute 也像兄弟，广播机制报错信息又长又看不懂。这篇用最小代码讲清它们的区别，让你不再瞎试。
cover: /images/covers/reshape-view-transpose-broadcast-video.jpg
coverAlt: 第 47 课张量形状转换视频封面，展示 reshape、view、transpose、permute 和广播机制的选择关系。
pubDate: 2026-07-07T09:40:00+08:00
tags: [PyTorch, reshape, view, transpose, 广播机制, 张量]
---

你写 `x.view(2, 3)` 报错，改成 `x.reshape(2, 3)` 就好了。你写 `x.transpose(0, 1)` 能跑，改成 `x.permute(0, 1)` 也能跑。它们到底有什么区别？什么时候用哪个？

还有广播机制——两个形状不同的张量相加，有时候自动对齐，有时候报一串看不懂的错。这篇把这些问题一次讲清。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/reshape-view-transpose-broadcast-video.jpg" aria-label="第 47 课：张量形状转换实战">
    <source src="/videos/lesson-47-reshape-view-transpose-broadcast.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 47 课视频 - reshape、view、transpose 和广播机制怎么选：张量形状转换实战</figcaption>
</figure>

---

## 概念回顾

上一篇我们讲清了 Shape 是数据契约。这一篇解决"怎么转换 Shape"。上一节你应该记住：Shape 变化有四类——增加维度、删除维度、改变维度大小、调换维度顺序。今天讲的这些函数，就是实现后两类转换的工具。

---

## reshape vs view：能重塑但不复制

这两个函数作用几乎一样：把张量改变形状，不改变数据。

```python
import torch

x = torch.arange(12)
print(x.shape)   # torch.Size([12])

y = x.reshape(3, 4)
z = x.view(3, 4)
print(y.shape)   # torch.Size([3, 4])
print(z.shape)   # torch.Size([3, 4])
```

**核心区别只有一个：内存连续性要求不同。**

| 函数 | 要求内存连续吗 | 不连续时会怎样 |
|---|---|---|
| `view` | 必须连续 | 报错 `RuntimeError: view size is not compatible` |
| `reshape` | 不要求 | 自动复制一份再重塑 |

```python
x = torch.randn(3, 4)

# transpose 之后内存不连续
x_t = x.transpose(0, 1)
print(x_t.is_contiguous())   # False

# view 报错
x_t.view(12)   # RuntimeError

# reshape 没事
x_t.reshape(12)   # 自动复制
```

**实战建议**：拿不准就用 `reshape`，它更宽容。`view` 性能稍好（不复制），但前提是内存连续。

### -1 的用法：自动推断

两个函数都支持 `-1`，表示"这一维的大小你帮我算"：

```python
x = torch.randn(32, 8, 8)

y = x.reshape(32, -1)      # [32, 64]  —— -1 自动算成 8*8=64
z = x.reshape(-1)          # [2048]    —— 展平成一维

# -1 只能出现一次
x.reshape(-1, -1)   # 报错，不知道你想怎么分
```

这是 Flatten 的等价写法，CNN 接全连接层时常用：

```python
# 这两行等价
x = x.reshape(x.shape[0], -1)
x = torch.flatten(x, start_dim=1)
```

---

## transpose vs permute：调换维度顺序

### transpose：只换两个维度

```python
x = torch.randn(2, 3, 4)   # [2, 3, 4]

y = x.transpose(0, 1)      # 交换第 0 和第 1 维
print(y.shape)              # [3, 2, 4]
```

只能一次换两个。

### permute：一次性重排所有维度

```python
x = torch.randn(2, 3, 4)   # [2, 3, 4]

y = x.permute(2, 0, 1)     # 第 2 维放最前，第 0 维居中，第 1 维最后
print(y.shape)              # [4, 2, 3]
```

`permute` 的参数是新顺序中，每个位置放原来的第几维。

### 最经典的图像场景

图像库读出来的图片通常是 `[H, W, C]`（高、宽、通道），但 PyTorch CNN 要 `[C, H, W]`：

```python
# [H, W, C] → [C, H, W]
img = torch.randn(32, 32, 3)        # 假设是 [H, W, C]
img_chw = img.permute(2, 0, 1)      # [3, 32, 32]
print(img_chw.shape)                # torch.Size([3, 32, 32])
```

### transpose 之后想用 view？先 contiguous

`transpose` 和 `permute` 返回的是**视图**，不复制数据，所以内存通常不连续。想在这之后用 `view`，得先 `contiguous()`：

```python
x = torch.randn(3, 4)
x_t = x.transpose(0, 1)       # 不连续

# x_t.view(12)                # 报错
x_t = x_t.contiguous()        # 复制成连续内存
x_t.view(12)                  # 现在能用了
```

或者直接用 `reshape`，它不挑食：

```python
x_t = x.transpose(0, 1)
y = x_t.reshape(12)           # 直接能用，内部自动处理
```

---

## squeeze 和 unsqueeze：增删大小为 1 的维度

### unsqueeze：加一个大小为 1 的维度

```python
x = torch.randn(10)           # [10]
y = x.unsqueeze(0)            # [1, 10]  —— 在第 0 维加
z = x.unsqueeze(1)            # [10, 1]  —— 在第 1 维加
```

最常见的用途：单张图片加 batch 维度。

```python
img = torch.randn(3, 32, 32)        # [C, H, W]
img_batch = img.unsqueeze(0)        # [1, C, H, W]  —— 模型需要 batch 维
```

### squeeze：删掉大小为 1 的维度

```python
x = torch.randn(1, 32, 1)     # [1, 32, 1]
y = x.squeeze()               # [32]  —— 删掉所有大小为 1 的维度
z = x.squeeze(0)              # [32, 1] —— 只删第 0 维
```

**危险操作**：不带参数的 `squeeze()` 会删掉所有大小为 1 的维度，可能误删 batch 维：

```python
x = torch.randn(1, 1, 32)     # batch=1, channel=1, length=32
x.squeeze()                   # [32] —— batch 和 channel 都删了！可能不是你想要的

# 推荐指定维度
x.squeeze(1)                  # [1, 32] —— 只删 channel 维
```

---

## 广播机制：形状不同也能运算

当两个形状不同的张量做 `+`、`-`、`*`、`/` 时，PyTorch 会自动"拉伸"某些维度让它们对齐。这就是广播。

### 核心法则：右对齐检查法

把两个形状**从右往左**对齐，每一维检查是否满足以下三个条件之一：

1. 两个数字**相等**
2. 其中一个是 **1**（会被拉伸）
3. 其中一个**不存在**（左边空出来，等同 1）

三个条件都不满足——报错。

```python
# 案例 1：成功
a = torch.ones(3, 1)     # [3, 1]
b = torch.ones(1, 2)     # [1, 2]
c = a + b                # [3, 2] —— 两个都拉伸
```

分析：
- 最后一维：`1` 和 `2` → 满足条件 2，`a` 拉伸成 2
- 第一维：`3` 和 `1` → 满足条件 2，`b` 拉伸成 3

```python
# 案例 2：失败
a = torch.ones(4, 3)     # [4, 3]
b = torch.ones(3, 3)     # [3, 3]
c = a + b                # 报错！
```

分析：
- 最后一维：`3` 和 `3` → 满足条件 1
- 第一维：`4` 和 `3` → 三个条件都不满足，报错

### 深度学习里的两个经典场景

**场景 1：偏置相加**

全连接层输出 `[B, C]`，偏置是 `[C]`。广播自动把偏置拉伸成 `[B, C]`：

```python
logits = torch.randn(32, 10)   # [B, C]
bias = torch.randn(10)          # [C]
result = logits + bias          # [32, 10] —— bias 广播成 [32, 10]
```

**场景 2：归一化**

图像 `[B, C, H, W]` 减去每个通道的均值 `[C, 1, 1]`：

```python
features = torch.randn(32, 3, 224, 224)
mean = torch.randn(3, 1, 1)          # [C, 1, 1]
normalized = features - mean          # [32, 3, 224, 224] —— 自动广播
```

---

## 速查表：什么时候用什么

| 需求 | 用什么 | 例子 |
|---|---|---|
| 改变形状（总元素数不变） | `reshape` | `[B,C,H,W] → [B, C*H*W]` |
| 改变形状，且内存确定连续 | `view` | 同上，性能稍好 |
| 交换两个维度 | `transpose` | `[B,T,D] → [T,B,D]` |
| 重排多个维度 | `permute` | `[B,H,W,C] → [B,C,H,W]` |
| 加一个大小为 1 的维度 | `unsqueeze` | `[F] → [1, F]` |
| 删掉大小为 1 的维度 | `squeeze(dim)` | `[1, B] → [B]` |
| 不同形状的元素级运算 | 广播（自动） | `[B,C] + [C]` |

---

## 三个高频错误

### 错误 1：transpose 后用 view 报错

```python
x = torch.randn(3, 4)
x_t = x.transpose(0, 1)
x_t.view(12)   # RuntimeError: view size is not compatible
```

**修复**：用 `reshape` 或先 `contiguous()`。

### 错误 2：squeeze 误删 batch 维

```python
x = torch.randn(1, 10)   # batch=1
y = x.squeeze()           # [10] —— batch 维没了！
model(y)                  # 报错：模型要 [B, F]，你给了 [F]
```

**修复**：指定维度 `x.squeeze(1)`，或者根本别 squeeze batch 维。

### 错误 3：广播静默错误

```python
logits = torch.randn(32, 10)   # [B, C]
y = torch.randn(32, 10)         # 本意是 [B]，却写成了 [B, 10]
loss = logits + y               # 不报错！但语义完全错了
```

广播不会报错，但结果可能完全不是你想要的。**养成习惯**：运算前 `print(x.shape)` 确认。

---

## 课后练习

**练习 1**：把 `[2, 3, 4]` 的张量变成 `[6, 4]`，写出三种不同的写法。

**练习 2**：下面代码能跑吗？为什么？结果 Shape 是多少？

```python
a = torch.randn(2, 1, 3)
b = torch.randn(4, 3)
c = a + b
```

**练习 3**：CNN 输出 `[32, 64, 7, 7]`，要接 `Linear(3136, 10)`。写一行代码把 CNN 输出转成 Linear 能接收的形状。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
```python
x = torch.randn(2, 3, 4)
# 写法一
x.reshape(6, 4)
# 写法二
x.view(6, 4)        # 原始内存连续时可用
# 写法三
x.permute(0, 1, 2).contiguous().view(6, 4)  # 或 x.flatten(0, 1)
# 也可以
x.reshape(6, -1)
```

**练习 2**：能跑。右对齐分析：
- 最后一维：`3` 和 `3` → 相等，通过
- 中间维：`1` 和 `4` → 1 会广播成 4
- 第一维：`2` 和 `不存在` → 缺位等同 1，广播成 2
- 结果 Shape：`[2, 4, 3]`

**练习 3**：
```python
x = torch.randn(32, 64, 7, 7)
x = x.reshape(32, -1)   # 或 x.reshape(x.shape[0], -1) 或 torch.flatten(x, 1)
# 现在 x.shape = [32, 3136]，可以接 Linear(3136, 10)
```
验证：64 * 7 * 7 = 3136，和 Linear 的 in_features 一致。
</details>

---

## 核心要点小结

- `reshape` 比 `view` 宽容——内存不连续也能用，拿不准就 reshape
- `transpose` 换两个维度，`permute` 重排所有维度
- transpose/permute 后内存不连续，想用 view 要先 contiguous
- `squeeze` 别乱用不带参数的版本，容易误删 batch 维
- 广播是自动的，但"不报错"不等于"结果对"，运算前 print shape
- 速查表：改形状 reshape、换维度 permute、加维度 unsqueeze、删维度 squeeze(dim)

下一篇我们离开形状转换，回到数据加载——自定义 Dataset 怎么封装你自己的训练数据。
