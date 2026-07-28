---
title: "怎样根据 loss、accuracy 和梯度诊断训练问题"
description: "训练 loss 不降？降了又升？训练好测试差？这篇把前面所有训练知识串成一套系统化的诊断流程，让你看曲线就知道问题在哪。"
cover: /images/covers/diagnose-training-loss-accuracy-video.jpg
coverAlt: "第 58 课训练诊断视频封面，展示 loss、accuracy、梯度范数和过拟合欠拟合排查路径。"
pubDate: 2026-07-26T09:20:00+08:00
tags: [PyTorch, 训练诊断, loss曲线, 梯度, 过拟合, 欠拟合]
---

你训练一个模型，loss 降不下去。是学习率的问题？数据的问题？模型结构的问题？还是代码有 bug？

没有诊断方法，就只能瞎试。这一篇把前面 13 篇 PyTorch 训练知识串成一套系统化的诊断流程——看 loss 曲线、accuracy 曲线、梯度分布，就能定位问题。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/diagnose-training-loss-accuracy-video.jpg" aria-label="第 58 课：训练诊断">
    <source src="/videos/lesson-58-diagnose-training-loss-accuracy.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-58-diagnose-training-loss-accuracy.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 58 课视频 - 怎样根据 loss、accuracy 和梯度诊断训练问题</figcaption>
</figure>

---

## 概念回顾

这是阶段四的最后一篇。前面我们学了：计算图（#45）、Shape（#46-47）、Dataset/DataLoader（#48-49）、nn.Module（#50）、初始化（#51）、优化器家族（#52-54）、学习率（#55）、GPU 训练（#56）、正则化（#57）。今天把这些全部串起来，形成诊断能力。

---

## 一句话解释

> 训练诊断的核心是"看曲线 + 分情况"：loss 不降看学习率和代码，loss 降了准确率不升看 Shape 和损失函数，训练好测试差看过拟合。

---

## 诊断流程图

遇到训练问题，按这个顺序排查：

```
1. loss 完全不动 → 学习率 / 代码 bug
2. loss 震荡或 NaN → 学习率太大 / 梯度爆炸
3. loss 降但 acc 不升 → Shape / 损失函数 / 标签
4. 训练好测试差 → 过拟合
5. 训练测试都差 → 欠拟合
```

---

## 情况 1：loss 完全不动

### 症状

```
Epoch 1, Loss: 2.3026
Epoch 2, Loss: 2.3026
Epoch 3, Loss: 2.3026
```

loss 几乎不变化，像一条水平线。

### 排查清单

| 检查项 | 怎么查 |
|---|---|
| 学习率是否太小 | `print(optimizer.param_groups[0]['lr'])`，试试大 10 倍 |
| 梯度是否为 None | `print(model.fc1.weight.grad)`，None 说明 backward 没工作 |
| 梯度是否全 0 | 检查初始化是否全 0（第 51 篇） |
| zero_grad 位置错 | 确认在 backward 前调用 |
| 数据和模型在同一设备 | `print(x.device, next(model.parameters()).device)` |
| requires_grad 是否开启 | `print(param.requires_grad)` 应为 True |

```python
# 诊断代码
for name, param in model.named_parameters():
    print(f"{name}: requires_grad={param.requires_grad}, grad={param.grad}")
```

---

## 情况 2：loss 震荡或变 NaN

### 症状

```
Epoch 1, Loss: 2.3000
Epoch 2, Loss: 1.8000
Epoch 3, Loss: 5.2000    # 突然飙升
Epoch 4, Loss: nan       # 变 NaN
```

### 排查清单

| 原因 | 解决 |
|---|---|
| 学习率太大 | 降 10 倍 |
| 梯度爆炸 | 加梯度裁剪 `clip_grad_norm_` |
| 数据有异常值 | 检查是否有 inf/nan，做标准化 |
| batch_size 太小 | 适当增大 |

```python
# 梯度裁剪
loss.backward()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()

# 检查数据
print(torch.isnan(x).any(), torch.isinf(x).any())
```

---

## 情况 3：loss 降但 accuracy 不升

这是最阴险的问题——loss 在降，但准确率不动。说明模型在"学"，但学错了方向。

### 排查清单

| 检查项 | 怎么查 |
|---|---|
| 标签 Shape 对不对 | 多分类要 `[B]` 不是 `[B, num_classes]`（第 46 篇） |
| 标签类型对不对 | CrossEntropyLoss 要 long，不是 float |
| 损失函数选对没 | 多分类用 CrossEntropyLoss，二分类用 BCEWithLogitsLoss |
| 多加了 Softmax | CrossEntropyLoss 内部自带，别手动加 |
| 输出维度对不对 | 最后一层 Linear 的 out_features 要等于 num_classes |

```python
# 诊断代码
logits = model(x)
print(f"logits shape: {logits.shape}")     # 应为 [B, num_classes]
print(f"y shape: {y.shape}")                # 应为 [B]
print(f"y dtype: {y.dtype}")                # 应为 torch.long
print(f"y 内容: {y[:10]}")                   # 应为 0~num_classes-1 的整数
```

---

## 情况 4：训练好测试差（过拟合）

### 症状

```
训练集: Loss 0.10, Acc 99%
验证集: Loss 0.80, Acc 75%
```

训练和验证之间有大 gap。

### 解决方案

上一篇（#57）讲过的正则化方法全套上：

1. Weight Decay（AdamW 的 weight_decay=0.01）
2. Dropout（0.3-0.5）
3. Early Stopping（patience=5）
4. 数据增强（图像任务）
5. 减小模型容量

---

## 情况 5：训练测试都差（欠拟合）

### 症状

```
训练集: Loss 1.80, Acc 45%
验证集: Loss 1.85, Acc 43%
```

训练集都没学好。

### 解决方案

| 方法 | 作用 |
|---|---|
| 增大模型 | 加宽/加深网络 |
| 训练更久 | 增加 epoch |
| 换更好的优化器 | SGD → Adam |
| 降正则化强度 | Dropout/Weight Decay 可能太强 |
| 检查数据质量 | 标签是否正确、特征是否有用 |
| 学习率调整 | 太小学不动 |

---

## 梯度健康检查

训练中定期检查梯度，能发现很多隐藏问题。

```python
# 检查梯度分布
for name, param in model.named_parameters():
    if param.grad is not None:
        grad_norm = param.grad.norm().item()
        print(f"{name}: grad_norm={grad_norm:.6f}")
```

| 梯度范数 | 可能问题 |
|---|---|
| 0 | 梯度消失或代码 bug |
| 很小（<1e-7） | 梯度消失，深层学不动 |
| 正常（0.01-1） | 健康 |
| 很大（>100） | 梯度爆炸，可能 NaN |

---

## 训练日志模板

好的训练日志能帮你快速定位问题：

```python
for epoch in range(epochs):
    model.train()
    train_loss, train_correct, total = 0, 0, 0

    for x, y in train_loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()
        train_correct += (logits.argmax(1) == y).sum().item()
        total += y.size(0)

    # 验证
    model.eval()
    val_loss, val_correct, val_total = 0, 0, 0
    with torch.no_grad():
        for x, y in val_loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            val_loss += criterion(logits, y).item()
            val_correct += (logits.argmax(1) == y).sum().item()
            val_total += y.size(0)

    print(f"Epoch {epoch+1}: "
          f"Train Loss={train_loss/total:.4f} Acc={train_correct/total:.4f} | "
          f"Val Loss={val_loss/val_total:.4f} Acc={val_correct/val_total:.4f} | "
          f"LR={optimizer.param_groups[0]['lr']:.6f}")
```

典型输出：

```
Epoch 1: Train Loss=1.8523 Acc=0.3520 | Val Loss=1.7501 Acc=0.4000 | LR=0.001000
Epoch 5: Train Loss=0.5234 Acc=0.8100 | Val Loss=0.6012 Acc=0.7800 | LR=0.001000
Epoch 10: Train Loss=0.1200 Acc=0.9700 | Val Loss=0.3500 Acc=0.8800 | LR=0.001000
Epoch 15: Train Loss=0.0500 Acc=0.9900 | Val Loss=0.5200 Acc=0.8500 | LR=0.000500
```

看第 15 行：训练 loss 还在降，验证 loss 开始升——过拟合了，该 Early Stopping。

---

## 课后练习

**练习 1**：训练 loss 2.30 不动（10 分类），accuracy 10%（等于随机猜）。列出 3 个可能原因和排查方法。

**练习 2**：训练 loss 从 2.0 降到 0.3，但验证 loss 从 0.5 升到 1.2。这是什么问题？怎么解决？

**练习 3**：写出你遇到 loss 变 NaN 时的完整排查步骤（至少 4 步）。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：loss=2.30 是 ln(10)，10 分类的随机猜测 loss。
1. 检查梯度：`print(param.grad)`，如果是 None 或 0，检查 backward 和 requires_grad
2. 检查学习率：可能太小，试 0.01
3. 检查标签：`print(y[:10])` 确认是 0-9 的整数，类型是 long
4. 检查数据：`print(x.shape, x.mean(), x.std())` 确认输入合理

**练习 2**：典型过拟合。训练在学，但开始记训练集的噪声。解决：① Early Stopping，在验证 loss 最低点（约 epoch 10）停止。② 加 Dropout。③ 加 Weight Decay。④ 数据增强。

**练习 3**：
1. 降低学习率 10 倍重试
2. 加梯度裁剪 `clip_grad_norm_(model.parameters(), max_norm=1.0)`
3. 检查数据有没有 inf/nan：`torch.isnan(x).any()`
4. 检查是否有除零操作或 log(0)
5. 检查初始化是否太大
6. 减小 batch_size 看是否是 BatchNorm 问题
</details>

---

## 核心要点小结

- 诊断流程：loss 不动 → 学习率/代码；震荡 → 降学习率/梯度裁剪；loss 降 acc 不升 → Shape/损失函数；训练好测试差 → 过拟合
- 训练时打印 train/val 的 loss 和 accuracy，看 gap 判断过拟合
- 梯度范数 0 是 bug，太小是消失，太大是爆炸
- loss=ln(num_classes) 且不动 = 随机猜测，检查代码
- 好的训练日志是诊断的基础
- 阶段四结束——你现在能独立搭建 PyTorch 训练脚本并诊断问题了

下一篇进入阶段五：用真实项目把前面学的全串起来，从线性回归开始。
