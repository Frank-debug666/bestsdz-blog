---
title: "CNN 入门：卷积和池化到底提取了什么"
description: "图像不能直接用全连接层处理——参数太多、丢失空间结构。CNN 用卷积提取局部特征，用池化压缩尺寸。这篇用最小代码讲清卷积核在做什么。"
cover: /images/covers/cnn-convolution-pooling-video.jpg
coverAlt: "第 64 课视频封面，展示卷积核扫描、特征图与池化压缩的核心流程。"
pubDate: 2026-08-03T09:30:00+08:00
tags: [PyTorch, CNN, 卷积, 池化, 图像分类, 特征提取]
---

前面所有项目都是表格数据——每条样本是一个特征向量。但图像不一样：一张 224×224 的彩色图有 15 万个数值，直接塞进全连接层参数量爆炸，而且丢失了"像素之间的空间关系"。

CNN 就是为图像设计的。它用卷积提取局部特征，用池化压缩尺寸。这篇讲清它们到底在做什么。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/cnn-convolution-pooling-video.jpg" aria-label="第 64 课：CNN 入门，卷积和池化">
    <source src="/videos/lesson-64-cnn-convolution-pooling.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-64-cnn-convolution-pooling.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 64 课视频 - CNN 入门：卷积和池化到底提取了什么</figcaption>
</figure>

---

## 概念回顾

第 46 篇讲过 CNN 的 Shape：输入 `[B, C, H, W]`，卷积后 `[B, C_out, H_out, W_out]`，池化后 `[B, C, H/2, W/2]`。今天解释为什么是这些变化。第 16 篇的 `nn.Linear` 是全连接层——CNN 的卷积层是它的图像版改进。

---

## 全连接层处理图像的问题

一张 32×32 的 RGB 图，展平后是 `3*32*32 = 3072` 个数。接一个 128 神经元的全连接层：

```python
nn.Linear(3072, 128)   # 参数量：3072 * 128 ≈ 39 万
```

两个问题：
1. **参数太多**：224×224 的图，参数量上千万
2. **丢失空间结构**：展平后"左上角的像素"和"右下角的像素"在向量里不相邻了，模型不知道它们的空间关系

CNN 的卷积层解决了这两个问题。

---

## 卷积：用小窗口扫描图像

### 核心思想

不把图像展平，而是用一个小窗口（卷积核）在图像上滑动，每次只看一个小区域。卷积核学到"这个小区域有什么特征"。

### 代码

```python
import torch
import torch.nn as nn

# 一张 1 通道的 5×5 图像
image = torch.randn(1, 1, 5, 5)   # [B=1, C=1, H=5, W=5]

# 3×3 卷积核，1 通道输入，1 通道输出
conv = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, padding=1)

output = conv(image)
print(f"输入: {image.shape}")    # [1, 1, 5, 5]
print(f"输出: {output.shape}")    # [1, 1, 5, 5]（padding=1 保持尺寸）
```

### 参数详解

```python
nn.Conv2d(
    in_channels,     # 输入通道数（RGB=3，灰度=1）
    out_channels,    # 输出通道数（=卷积核数量）
    kernel_size,     # 卷积核大小（通常 3 或 5）
    stride=1,        # 滑动步长
    padding=0,       # 边缘填充
    bias=True        # 是否加偏置
)
```

| 参数 | 作用 | 常用值 |
|---|---|---|
| `in_channels` | 输入图像的通道数 | RGB=3 |
| `out_channels` | 输出特征图数量 | 16, 32, 64 |
| `kernel_size` | 卷积核大小 | 3, 5 |
| `stride` | 滑动步长 | 1（保持尺寸）, 2（尺寸减半） |
| `padding` | 边缘填充 | kernel_size=3 时用 1 保持尺寸 |

### 输出尺寸公式

$$H_{out} = \lfloor \frac{H + 2P - K}{S} \rfloor + 1$$

- $H$：输入高度
- $P$：padding
- $K$：kernel_size
- $S$：stride

```python
# 保持尺寸：kernel=3, padding=1, stride=1
conv = nn.Conv2d(3, 16, kernel_size=3, padding=1, stride=1)
# [B, 3, 32, 32] → [B, 16, 32, 32]

# 尺寸减半：kernel=3, padding=1, stride=2
conv = nn.Conv2d(3, 16, kernel_size=3, padding=1, stride=2)
# [B, 3, 32, 32] → [B, 16, 16, 16]
```

### 卷积核在学什么

每个卷积核学到一种局部特征：
- 有的检测边缘
- 有的检测颜色变化
- 有的检测纹理
- 深层卷积核检测更复杂的模式（眼睛、轮子）

```python
# 看一个卷积核的权重
print(conv.weight.shape)   # [out_channels, in_channels, K, K]
# [16, 3, 3, 3] —— 16 个卷积核，每个 3×3×3
```

---

## 池化：压缩尺寸

### 核心思想

卷积后的特征图还是很大，池化把它压缩——只保留最重要的信息，减少计算量。

### 最大池化

```python
pool = nn.MaxPool2d(kernel_size=2, stride=2)
# 每 2×2 的窗口取最大值

x = torch.randn(1, 16, 32, 32)
output = pool(x)
print(f"池化前: {x.shape}")      # [1, 16, 32, 32]
print(f"池化后: {output.shape}")   # [1, 16, 16, 16]  尺寸减半
```

| 池化类型 | 做法 | 特点 |
|---|---|---|
| MaxPool2d | 取窗口最大值 | 保留最强响应，最常用 |
| AvgPool2d | 取窗口平均值 | 平滑 |
| AdaptiveAvgPool2d | 自适应到指定尺寸 | 全局平均池化常用 |

**池化没有参数**——它只是固定的数学运算。

---

## 一个完整的 CNN 块

```python
class ConvBlock(nn.Module):
    """标准的 CNN 块：卷积 → 激活 → 池化"""
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
    def forward(self, x):
        return self.block(x)
```

Shape 变化：

```python
block = ConvBlock(3, 16)
x = torch.randn(1, 3, 32, 32)
out = block(x)
print(out.shape)   # [1, 16, 16, 16]
# 通道 3→16，尺寸 32→16
```

---

## 完整 CNN 图像分类模型

```python
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # 特征提取部分
        self.features = nn.Sequential(
            ConvBlock(3, 16),     # [B,3,32,32] → [B,16,16,16]
            ConvBlock(16, 32),    # → [B,32,8,8]
            ConvBlock(32, 64),    # → [B,64,4,4]
        )
        # 分类部分
        self.classifier = nn.Sequential(
            nn.Flatten(),                   # [B, 64*4*4] = [B, 1024]
            nn.Linear(64 * 4 * 4, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

model = SimpleCNN(num_classes=10)
x = torch.randn(1, 3, 32, 32)
print(model(x).shape)   # [1, 10]
```

### Shape 流水线

```
[B, 3, 32, 32]
  → Conv2d(3→16) + Pool → [B, 16, 16, 16]
  → Conv2d(16→32) + Pool → [B, 32, 8, 8]
  → Conv2d(32→64) + Pool → [B, 64, 4, 4]
  → Flatten → [B, 1024]
  → Linear(1024→128) → [B, 128]
  → Linear(128→10) → [B, 10]
```

---

## 三个高频错误

### 错误 1：Flatten 后维度算错

```python
# ❌ 最后一层卷积输出 [B, 64, 4, 4]，但 Linear 写了
nn.Linear(64 * 8 * 8, 128)   # 算成了 4096

# ✅
nn.Linear(64 * 4 * 4, 128)   # 正确是 1024
```

**排查方法**：在 Flatten 后 `print(x.shape)` 确认。

### 错误 2：输入忘了通道维度

```python
# ❌ 灰度图只给了 [B, 28, 28]
model(torch.randn(32, 28, 28))   # 报错

# ✅ 加通道维度
model(torch.randn(32, 1, 28, 28))   # [B, C=1, H, W]
```

### 错误 3：stride=2 和 pool 混用

```python
# 尺寸减太多，几层就变成 1×1
nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),  # 减半
nn.MaxPool2d(2),   # 又减半
# 一层就缩小 4 倍
```

通常卷积用 stride=1 保持尺寸，靠池化来缩小。

---

## 课后练习

**练习 1**：输入 `[32, 3, 64, 64]`，经过 `Conv2d(3, 32, 3, padding=1)` + `MaxPool2d(2)`，输出 Shape 是多少？

**练习 2**：为什么卷积层比全连接层参数少？用具体数字说明。

**练习 3**：CNN 最后为什么要有 Flatten + Linear？只保留卷积层不行吗？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
- Conv2d(padding=1, kernel=3, stride=1)：尺寸不变，`[32, 32, 64, 64]`
- MaxPool2d(2)：尺寸减半，`[32, 32, 32, 32]`

**练习 2**：以 `Conv2d(3, 16, 3)` 为例，参数量 = `out_channels × in_channels × K × K + out_channels` = 16 × 3 × 3 × 3 + 16 = 448。如果用全连接层处理 3×32×32=3072 的输入到 16 个输出，参数量 = 3072 × 16 = 49152。卷积层参数少 100 倍，因为卷积核在整张图上共享权重。

**练习 3**：卷积层输出是 `[B, C, H, W]` 的特征图，不是分类结果。分类需要一个 `[B, num_classes]` 的向量。Flatten 把特征图展平，Linear 把它映射到类别数。另外，卷积只提取局部特征，Linear 负责综合所有特征做最终判断。如果只用卷积，需要用全局池化（AdaptiveAvgPool2d）替代 Flatten+Linear。
</details>

---

## 核心要点小结

- 卷积用小窗口扫描图像，提取局部特征，参数比全连接少得多
- 卷积输出尺寸公式：$(H + 2P - K) / S + 1$
- padding=1 + kernel=3 + stride=1 保持尺寸不变
- 最大池化取窗口最大值，压缩尺寸，无参数
- 标准 CNN 块：Conv2d → ReLU → MaxPool2d
- 完整 CNN：特征提取（卷积+池化）→ Flatten → 分类（Linear）
- Flatten 后的维度必须和 Linear 的 in_features 精确匹配

这一篇是阶段五的最后几篇之一。CNN 是图像任务的基石，下一篇先把真实图片整理成网络需要的通道、尺寸与批次，再进入完整图像分类项目。
