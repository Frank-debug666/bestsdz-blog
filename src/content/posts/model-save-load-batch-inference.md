---
title: "模型保存、加载和批量推理实战"
description: "训练好的模型不能只活在内存里。这篇讲清怎么把模型存成文件、怎么加载回来预测、怎么做批量推理，以及断点续训的完整做法。"
cover: /images/covers/model-save-load-batch-inference-video.jpg
coverAlt: "第 63 课视频封面，展示从 state_dict 保存、跨设备加载到批量推理的完整流程。"
pubDate: 2026-08-03T09:00:00+08:00
tags: [PyTorch, 模型保存, 模型加载, 批量推理, 断点续训, state_dict]
---

你花 3 小时训练了一个模型，关掉电脑就没了。下次想用还得重训。这就是为什么必须学会模型保存——训练成果要能存成文件、随时加载、批量预测。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/model-save-load-batch-inference-video.jpg" aria-label="第 63 课：模型保存、加载和批量推理实战">
    <source src="/videos/lesson-63-model-save-load-batch-inference.mp4" type="video/mp4" />
    <track kind="captions" src="/videos/lesson-63-model-save-load-batch-inference.vtt" srclang="zh-CN" label="中文" default />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 63 课视频 - 模型保存、加载和批量推理实战</figcaption>
</figure>

---

## 概念回顾

第 50 篇讲了 nn.Module 的 `state_dict()` 返回模型参数。第 45 篇讲了优化器也有内部状态。今天把它们存到文件里。第 56 篇讲了 GPU 训练——保存加载时还要处理设备问题。

---

## 一句话解释

> 用 `torch.save` 存模型参数，用 `load_state_dict` 加载。存的是 `state_dict`（参数字典），不是整个模型对象。

---

## 方法 1：只存模型参数（推荐）

### 保存

```python
torch.save(model.state_dict(), 'model.pth')
```

`.state_dict()` 返回一个字典，包含所有参数的名称和值：

```python
print(model.state_dict().keys())
# odict_keys(['net.0.weight', 'net.0.bias', 'net.2.weight', 'net.2.bias', ...])
```

### 加载

```python
# 1. 先定义相同结构的模型
model = TabularClassifier(in_features=20, num_classes=4)

# 2. 加载参数
model.load_state_dict(torch.load('model.pth'))

# 3. 切到评估模式
model.eval()
```

**关键**：加载前必须先创建相同结构的模型对象——`load_state_dict` 只填参数，不创建模型。

### 推理

```python
with torch.no_grad():
    x_new = torch.tensor([[...]]).float()
    logits = model(x_new)
    pred = logits.argmax(dim=1)
    print(f"预测类别: {pred.item()}")
```

---

## 方法 2：存完整 checkpoint（断点续训）

训练中断了想继续？需要存更多东西：模型参数 + 优化器状态 + 当前 epoch。

### 保存 checkpoint

```python
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': loss.item(),
}
torch.save(checkpoint, 'checkpoint.pth')
```

### 加载 checkpoint 续训

```python
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
start_epoch = checkpoint['epoch'] + 1

# 继续训练
for epoch in range(start_epoch, total_epochs):
    ...
```

**为什么要存优化器状态？** Adam 内部维护动量（$m_t$、$v_t$），如果不恢复，等于从头开始算动量，前几步更新方向会偏。

---

## 批量推理

实际应用中，要对大量数据做预测。

```python
import torch
from torch.utils.data import DataLoader

def batch_inference(model, dataset, device='cpu', batch_size=64):
    """批量推理，返回所有预测结果"""
    model.eval()
    model = model.to(device)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False)

    all_preds = []
    all_probs = []

    with torch.no_grad():
        for batch_x in loader:
            if isinstance(batch_x, (list, tuple)):
                batch_x = batch_x[0]
            batch_x = batch_x.to(device)

            logits = model(batch_x)
            probs = torch.softmax(logits, dim=1)
            preds = logits.argmax(dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    return all_preds, all_probs

# 使用
preds, probs = batch_inference(model, test_dataset, device='cuda')
print(f"前 10 个预测: {preds[:10]}")
print(f"前 10 个概率: {probs[:10]}")
```

**关键点**：
- `shuffle=False` 保持顺序，方便对照
- `torch.no_grad()` 不建计算图，省显存
- `model.eval()` 关闭 Dropout 和 BatchNorm

---

## 跨设备加载

### GPU 训练 → CPU 推理

```python
# GPU 上保存的模型，在 CPU 机器上加载
model.load_state_dict(torch.load('model.pth', map_location='cpu'))
```

`map_location='cpu'` 把 GPU 上的参数映射到 CPU。

### CPU 训练 → GPU 推理

```python
model.load_state_dict(torch.load('model.pth'))
model = model.to('cuda')
```

### 通用写法

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.load_state_dict(torch.load('model.pth', map_location=device))
model = model.to(device)
```

---

## 保存最佳模型

训练时保存验证集上表现最好的模型：

```python
best_val_acc = 0

for epoch in range(epochs):
    # 训练...
    val_acc = evaluate(model, val_loader)

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"保存最佳模型，Val Acc={val_acc:.4f}")

# 训练完后加载最佳模型
model.load_state_dict(torch.load('best_model.pth'))
```

---

## 完整项目模板

```python
import torch
import torch.nn as nn

# === 训练阶段 ===
model = MyModel()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

best_acc = 0
for epoch in range(100):
    train(...)
    val_acc = evaluate(...)

    if val_acc > best_acc:
        best_acc = val_acc
        torch.save({
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'epoch': epoch,
            'val_acc': val_acc,
        }, 'best_checkpoint.pth')

# === 推理阶段（另一个脚本）===
model = MyModel()  # 相同结构
checkpoint = torch.load('best_checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

with torch.no_grad():
    logits = model(new_data)
    pred = logits.argmax(dim=1)
```

---

## 三个高频错误

### 错误 1：存整个模型对象

```python
# ❌ 存整个模型（pickle）
torch.save(model, 'model.pth')

# ✅ 只存 state_dict
torch.save(model.state_dict(), 'model.pth')
```

存整个模型会绑定代码路径和类定义，换环境容易报错。存 state_dict 更通用。

### 错误 2：加载时结构不匹配

```python
# 训练时
class Model(nn.Module):
    def __init__(self):
        self.fc = nn.Linear(20, 10)

# 加载时改了结构
class Model(nn.Module):
    def __init__(self):
        self.fc = nn.Linear(30, 10)   # ❌ 维度变了

model.load_state_dict(torch.load('model.pth'))
# RuntimeError: Error(s) in loading state_dict
```

**修复**：加载时的模型结构必须和保存时完全一致。

### 错误 3：推理忘 eval 和 no_grad

```python
# ❌ 推理时 Dropout 还在随机
predictions = model(test_data)

# ✅
model.eval()
with torch.no_grad():
    predictions = model(test_data)
```

---

## 课后练习

**练习 1**：断点续训时为什么要恢复优化器的 state_dict？不恢复会怎样？

**练习 2**：写一个函数，接收模型路径和数据，完成单条数据的预测。

**练习 3**：GPU 训练保存的模型，在只有 CPU 的服务器上加载，代码怎么写？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：Adam 内部维护一阶动量 $m_t$ 和二阶动量 $v_t$，这些是基于历史梯度累积的。不恢复优化器状态，等于从头算动量，前几步的更新方向会不稳定，可能影响收敛。SGD+Momentum 同理（动量 $v_t$ 丢失）。对纯 SGD（无 momentum）影响较小。

**练习 2**：
```python
def predict_single(model_path, x, model_class, in_features, num_classes):
    model = model_class(in_features, num_classes)
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    with torch.no_grad():
        x = torch.tensor(x).float().unsqueeze(0)  # 加 batch 维
        logits = model(x)
        pred = logits.argmax(dim=1).item()
    return pred
```

**练习 3**：
```python
model = MyModel()
model.load_state_dict(torch.load('model.pth', map_location='cpu'))
model.eval()
# 在 CPU 上推理，不需要 .to('cuda')
```
</details>

---

## 核心要点小结

- 推荐存 `state_dict`，不存整个模型对象
- 加载前必须先创建相同结构的模型对象
- 断点续训存 checkpoint：模型参数 + 优化器状态 + epoch
- 批量推理用 DataLoader(shuffle=False) + no_grad + eval
- 跨设备加载用 `map_location`
- 训练时保存验证集最佳模型，最后加载最佳模型推理

下一篇进入图像世界——CNN 的卷积和池化到底在提取什么。
