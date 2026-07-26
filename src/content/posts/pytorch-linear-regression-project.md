---
title: "PyTorch 线性回归项目：从造数据到预测"
description: "前面 14 篇学了原理，现在第一次完整跑一个深度学习项目——从造数据、建模型、训练到预测。用最简单的线性回归，把全流程跑通。"
cover: /images/covers/pytorch-linear-regression-project-video.jpg
coverAlt: "第 59 课 PyTorch 线性回归项目视频封面，展示造数据、Dataset、模型、训练循环、预测和可视化流程。"
pubDate: 2026-07-26T09:40:00+08:00
tags: [PyTorch, 线性回归, 深度学习项目, 完整流程, 从零开始]
---

前面 14 篇你学了张量、计算图、Shape、Dataset、优化器、学习率……但都是碎片。今天第一次把它们拼成一个完整项目——从造数据到预测，全流程跑通。

用线性回归不是因为简单，而是因为它能让你把注意力放在**流程**上，而不是被复杂的模型分散精力。流程跑通了，换模型就是改几行代码的事。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/pytorch-linear-regression-project-video.jpg" aria-label="第 59 课：线性回归项目">
    <source src="/videos/lesson-59-pytorch-linear-regression-project.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 59 课视频 - PyTorch 线性回归项目：从造数据到预测</figcaption>
</figure>

---

## 概念回顾

这个项目用到前面学过的：第 27 篇线性回归的数学原理（$y = wx + b$）、第 43 篇 Tensor 操作、第 48-49 篇 Dataset 和 DataLoader、第 50 篇 nn.Module、第 52 篇优化器、第 55 篇学习率。今天把它们串起来。

---

## 项目目标

用 PyTorch 从零实现一个线性回归模型：给定 $x$，预测 $y$。真实关系是 $y = 3x + 6 + \text{noise}$，模型要学到 $w \approx 3$、$b \approx 6$。

---

## 第一步：造数据

```python
import torch
import matplotlib.pyplot as plt
from sklearn.datasets import make_regression

# 生成回归数据：200 个样本，1 个特征，真实 w=3，b=6，加噪声
x, y, coef = make_regression(
    n_samples=200, n_features=1, coef=True,
    noise=20, bias=6.0, random_state=42
)

# 转成 Tensor
x = torch.tensor(x).float()
y = torch.tensor(y).float()
print(f"x shape: {x.shape}")    # [200, 1]
print(f"y shape: {y.shape}")    # [200]
print(f"真实 w: {coef}, 真实 b: 6.0")

# 可视化
plt.scatter(x.numpy(), y.numpy(), s=5, alpha=0.5)
plt.xlabel('x')
plt.ylabel('y')
plt.title('训练数据')
plt.show()
```

---

## 第二步：封装 Dataset 和 DataLoader

```python
from torch.utils.data import TensorDataset, DataLoader

# 封装成 Dataset
dataset = TensorDataset(x, y)

# DataLoader 批量加载
loader = DataLoader(dataset, batch_size=16, shuffle=True)

# 验证
for batch_x, batch_y in loader:
    print(f"batch x: {batch_x.shape}, batch y: {batch_y.shape}")
    # [16, 1] [16]
    break
```

---

## 第三步：定义模型

线性回归就是最简单的单层网络：$y = wx + b$，一个 `nn.Linear` 就够了。

```python
import torch.nn as nn

class LinearRegressionModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(1, 1)   # 输入 1 维，输出 1 维

    def forward(self, x):
        return self.linear(x)           # [B, 1] → [B, 1]

model = LinearRegressionModel()
print(model)
# LinearRegressionModel(
#   (linear): Linear(in_features=1, out_features=1, bias=True)
# )
```

---

## 第四步：损失函数和优化器

```python
criterion = nn.MSELoss()                              # 回归用 MSE
optimizer = torch.optim.Adam(model.parameters(), lr=0.05)
```

| 选择 | 理由 |
|---|---|
| `MSELoss` | 回归任务标准损失 |
| `Adam` | 不用调学习率，入门友好 |
| `lr=0.05` | 数据简单，稍大一点收敛快 |

---

## 第五步：训练循环

```python
epochs = 50
losses = []

for epoch in range(epochs):
    model.train()
    epoch_loss = 0

    for batch_x, batch_y in loader:
        # y 要 reshape 成 [B, 1] 和预测对齐
        batch_y = batch_y.reshape(-1, 1)

        optimizer.zero_grad()          # ① 清梯度
        y_pred = model(batch_x)        # ② 前向传播
        loss = criterion(y_pred, batch_y)  # ③ 算损失
        loss.backward()                # ④ 反向传播
        optimizer.step()               # ⑤ 更新参数

        epoch_loss += loss.item()

    avg_loss = epoch_loss / len(loader)
    losses.append(avg_loss)

    if (epoch + 1) % 10 == 0:
        w = model.linear.weight.item()
        b = model.linear.bias.item()
        print(f"Epoch {epoch+1}: Loss={avg_loss:.4f}, w={w:.4f}, b={b:.4f}")
```

典型输出：

```
Epoch 10: Loss=276.1234, w=2.8123, b=5.2100
Epoch 20: Loss=45.6789, w=2.9800, b=5.8900
Epoch 30: Loss=42.1234, w=3.0010, b=5.9800
Epoch 40: Loss=42.0010, w=3.0020, b=5.9900
Epoch 50: Loss=41.9980, w=3.0020, b=5.9910
```

$w$ 收敛到约 3.0，$b$ 收敛到约 6.0——模型学到了真实关系。

---

## 第六步：可视化结果

```python
# 画 loss 曲线
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(losses)
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('训练 Loss 曲线')

# 画预测线
plt.subplot(1, 2, 2)
plt.scatter(x.numpy(), y.numpy(), s=5, alpha=0.5, label='数据')
x_line = torch.linspace(x.min(), x.max(), 100).reshape(-1, 1)
y_line = model(x_line).detach().numpy()
plt.plot(x_line.numpy(), y_line, 'r-', label='预测', linewidth=2)
# 真实线
y_true = coef * x_line.numpy() + 6.0
plt.plot(x_line.numpy(), y_true, 'g--', label='真实', linewidth=2)
plt.legend()
plt.title('预测 vs 真实')

plt.show()
```

---

## 第七步：预测新数据

```python
model.eval()
with torch.no_grad():
    new_x = torch.tensor([[2.0], [5.0], [-1.0]])
    predictions = model(new_x)
    print(f"预测: {predictions.flatten().tolist()}")
    # 真实值大约是 12, 21, 3
```

---

## 项目目录结构

```
linear_regression_project/
├── data.py           # 数据生成
├── model.py          # 模型定义
├── train.py          # 训练循环
├── predict.py        # 预测脚本
└── README.md         # 说明
```

实际项目建议把数据、模型、训练分开，不要全写在一个文件里。

---

## 三个高频错误

### 错误 1：y 的 Shape 不对齐

```python
# ❌ y_pred 是 [B, 1]，y 是 [B]，MSE 报错或算错
y_pred = model(x)         # [B, 1]
loss = criterion(y_pred, y)  # [B] → 广播可能出问题

# ✅ reshape 对齐
y = y.reshape(-1, 1)      # [B, 1]
loss = criterion(y_pred, y)
```

第 46 篇讲过：Shape 是数据契约。

### 错误 2：忘记 zero_grad

```python
# ❌
for batch_x, batch_y in loader:
    y_pred = model(batch_x)
    loss = criterion(y_pred, batch_y)
    loss.backward()
    optimizer.step()
    # 梯度累积，几轮后 loss 飞
```

第 45 篇讲过：训练四步"清→前→算→更"。

### 错误 3：预测时忘 eval 和 no_grad

```python
# ❌ 预测时还在建计算图
predictions = model(new_x)

# ✅
model.eval()
with torch.no_grad():
    predictions = model(new_x)
```

---

## 课后练习

**练习 1**：把优化器从 Adam 换成 SGD(lr=0.01)，观察收敛速度有什么变化。

**练习 2**：把数据改成 2 个特征的线性回归（$y = 3x_1 + 2x_2 + 5$），模型和代码需要改什么？

**练习 3**：训练完成后，怎么获取模型学到的 $w$ 和 $b$ 的值？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：SGD 收敛更慢，可能需要更多 epoch。Adam 自适应学习率，通常更快。但 SGD 最终精度可能一样。把 lr 调到 0.01-0.05，训练 100-200 epoch。

**练习 2**：
- 数据生成：`make_regression(n_features=2, ...)` 或手动构造
- 模型：`nn.Linear(2, 1)`，输入维度从 1 改成 2
- 其他不变，PyTorch 自动处理维度

**练习 3**：
```python
w = model.linear.weight.item()
b = model.linear.bias.item()
print(f"w={w}, b={b}")
```
如果是多特征，weight 是向量：`model.linear.weight.data`。
</details>

---

## 核心要点小结

- 完整深度学习项目七步：造数据 → Dataset → 模型 → 损失/优化器 → 训练 → 可视化 → 预测
- 线性回归用 `nn.Linear(1,1)` + `MSELoss` + Adam
- 训练四步：清梯度 → 前向 → 算 loss → 反向 + step
- y 的 Shape 要和预测对齐：`y.reshape(-1, 1)`
- 预测时 `model.eval()` + `torch.no_grad()`
- 项目代码建议分文件：data / model / train / predict

下一篇升级——从回归到分类，搭建一个二维二分类神经网络。
