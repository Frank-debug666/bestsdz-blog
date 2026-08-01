---
title: "决策边界可视化：模型到底学出了什么"
description: "准确率 99% 但不知道模型怎么分的？这篇把分类模型的决策边界画出来，让你亲眼看到模型在二维空间画了一条什么形状的分界线。"
cover: /images/covers/decision-boundary-visualization-video.jpg
coverAlt: "第 61 课决策边界可视化视频封面，展示网格采样、概率色块、零点五等高线与数据点。"
pubDate: 2026-08-01T09:20:00+08:00
tags: [PyTorch, 决策边界, 可视化, 分类模型, 模型解释]
---

上一篇你训练了一个二分类网络，准确率 99%。但模型到底画了一条什么样的线把两类点分开？是直线？曲线？

决策边界可视化就是回答这个问题的。它把模型的"判断逻辑"变成你能看见的图。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/decision-boundary-visualization-video.jpg" aria-label="第 61 课：决策边界可视化">
    <source src="/videos/lesson-61-decision-boundary-visualization.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-61-decision-boundary-visualization.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 61 课视频 - 决策边界可视化：模型到底学出了什么</figcaption>
</figure>

---

## 概念回顾

上一篇我们搭了二分类网络，输入 `[x1, x2]`，输出概率。今天我们把整个二维空间上每个点的预测概率都算出来，画成颜色图——这就是决策边界。第 50 篇的 nn.Module、第 46 篇的 Shape 知识都要用上。

---

## 一句话解释

> 决策边界是模型在输入空间里"分界线"的位置。可视化方法：在整个二维平面上密集取点，用模型预测每个点的类别，画成颜色图。

---

## 核心方法：网格采样

```python
import torch
import numpy as np
import matplotlib.pyplot as plt

def plot_decision_boundary(model, x, y):
    """画出模型的决策边界"""
    model.eval()

    # 1. 确定坐标范围
    x_min, x_max = x[:, 0].min() - 1, x[:, 0].max() + 1
    y_min, y_max = x[:, 1].min() - 1, x[:, 1].max() + 1

    # 2. 生成网格点（密集采样）
    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, 200),
        np.linspace(y_min, y_max, 200)
    )

    # 3. 网格点展平成 [N, 2]
    grid = torch.tensor(np.c_[xx.ravel(), yy.ravel()]).float()

    # 4. 模型预测
    with torch.no_grad():
        logits = model(grid)
        probs = torch.sigmoid(logits).numpy().reshape(xx.shape)

    # 5. 画图
    plt.figure(figsize=(8, 6))
    # 背景颜色：概率值
    plt.contourf(xx, yy, probs, levels=50, cmap='RdBu', alpha=0.6)
    # 分界线：概率=0.5
    plt.contour(xx, yy, probs, levels=[0.5], colors='black', linewidths=2)
    # 数据点
    plt.scatter(x[y.flatten()==0, 0], x[y.flatten()==0, 1],
                c='blue', label='类别 0', edgecolors='k')
    plt.scatter(x[y.flatten()==1, 0], x[y.flatten()==1, 1],
                c='red', label='类别 1', edgecolors='k')
    plt.legend()
    plt.title('决策边界')
    plt.show()
```

---

## 对比不同模型的决策边界

这是最有意思的部分——用不同的模型结构，看决策边界长什么样。

### 模型 1：单层线性模型（无隐藏层）

```python
model_linear = nn.Sequential(nn.Linear(2, 1))
# 决策边界是一条直线
```

### 模型 2：带一个隐藏层

```python
model_hidden = nn.Sequential(
    nn.Linear(2, 16),
    nn.ReLU(),
    nn.Linear(16, 1)
)
# 决策边界是折线
```

### 模型 3：更深的网络

```python
model_deep = nn.Sequential(
    nn.Linear(2, 32),
    nn.ReLU(),
    nn.Linear(32, 32),
    nn.ReLU(),
    nn.Linear(32, 1)
)
# 决策边界是更复杂的曲线
```

### 训练并可视化

```python
import torch.nn as nn
import torch.optim as optim

# 训练三个模型
models = {
    "线性": nn.Sequential(nn.Linear(2, 1)),
    "1层隐藏": nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 1)),
    "2层隐藏": nn.Sequential(nn.Linear(2, 32), nn.ReLU(),
                               nn.Linear(32, 32), nn.ReLU(), nn.Linear(32, 1)),
}

for name, model in models.items():
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    for epoch in range(100):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

    plot_decision_boundary(model, x, y)
    print(f"{name} - 最终 Loss: {loss.item():.4f}")
```

---

## 用非线性数据看效果

线性可分的数据用直线就能分，看不出区别。用非线性数据（如同心圆、月牙形）才能看出深度网络的优势。

```python
from sklearn.datasets import make_moons

# 月牙形数据（非线性可分）
x_moon, y_moon = make_moons(n_samples=400, noise=0.15, random_state=42)
x_moon = torch.tensor(x_moon).float()
y_moon = torch.tensor(y_moon).reshape(-1, 1).float()

# 训练线性模型
model_linear = nn.Sequential(nn.Linear(2, 1))
# ... 训练 ...
plot_decision_boundary(model_linear, x_moon, y_moon)
# 直线根本分不开月牙！

# 训练隐藏层模型
model_hidden = nn.Sequential(
    nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 1)
)
# ... 训练 ...
plot_decision_boundary(model_hidden, x_moon, y_moon)
# 弯曲边界贴合月牙形状
```

---

## 决策边界反映的模型特性

| 决策边界形状 | 模型特性 | 可能的问题 |
|---|---|---|
| 直线 | 线性模型 | 无法分非线性数据 |
| 贴合数据的曲线 | 合适的深度模型 | — |
| 过于复杂的锯齿 | 模型太深/过拟合 | 测试集差 |
| 边界没贴合数据 | 欠拟合 | 模型太简单或训练不够 |

---

## 过拟合的决策边界长什么样

```python
# 极端过拟合：超深网络 + 无正则化
model_overfit = nn.Sequential(
    nn.Linear(2, 128), nn.ReLU(),
    nn.Linear(128, 128), nn.ReLU(),
    nn.Linear(128, 128), nn.ReLU(),
    nn.Linear(128, 1)
)
# 训练后决策边界会非常扭曲，为了分对每个点画了很多奇怪的弯
```

过拟合的决策边界特点：训练集全分对，但边界扭曲，明显在"迁就"噪声点。

---

## 三个要点

1. **决策边界是模型理解数据的窗口**——线性模型画直线，深度模型画曲线
2. **非线性数据需要非线性模型**——月牙、同心圆用线性模型分不开
3. **过拟合的边界扭曲**——太复杂的模型会迁就噪声

---

## 课后练习

**练习 1**：线性模型在月牙数据上的决策边界是什么形状？为什么？

**练习 2**：一个 3 层隐藏层的模型在简单线性可分数据上训练，决策边界会是直线还是曲线？为什么？

**练习 3**：怎么用决策边界图判断模型是否过拟合？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：直线。因为 `nn.Linear(2, 1)` 的数学形式是 $w_1 x_1 + w_2 x_2 + b = 0$，这是一条直线方程。不管怎么训练，线性模型的决策边界永远是直线（在高维是超平面）。月牙数据是非线性可分的，直线无法分开。

**练习 2**：接近直线。虽然模型有能力画曲线，但线性可分数据的最优解就是直线。模型会学到接近线性的边界，因为这样 loss 最低。ReLU 在某些区域可能让边界有轻微弯折，但总体接近直线。

**练习 3**：看边界是否"过于扭曲"。如果训练集准确率 100% 但决策边界画了很多奇怪的弯去迁就个别噪声点，就是过拟合。正常的决策边界应该平滑、贴合数据的大趋势。
</details>

---

## 核心要点小结

- 决策边界是模型在输入空间画的"分界线"
- 可视化方法：网格采样 + 模型预测 + 颜色填充
- 线性模型决策边界是直线，深度网络是曲线
- 非线性数据（月牙、同心圆）需要隐藏层 + ReLU
- 过拟合的决策边界扭曲、迁就噪声
- 可视化是理解模型的最好工具——别只看准确率

下一篇把项目复杂度升级——从造数据到真实 CSV 表格分类。
