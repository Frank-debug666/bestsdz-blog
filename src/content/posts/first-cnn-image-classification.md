---
title: "第一个 CNN 图像分类训练项目"
description: "从数据增强、CNN、训练循环、验证指标到保存最佳权重，完整跑通一个 PyTorch 图像分类项目，并理解每一段代码为什么存在。"
cover: /images/covers/first-cnn-image-classification.png
coverAlt: "第 66 课知识图，展示 CIFAR-10 数据准备、CNN 定义、训练验证和最佳模型保存流程。"
pubDate: 2026-07-27T09:20:00+08:00
tags: [PyTorch, CNN, 图像分类, CIFAR10, 训练循环, 项目实战]
---

前两篇分别解决了“CNN 在做什么”和“图片怎样进入网络”。现在把它们真正串起来：训练一个能区分 10 类图片的 CNN。

这篇不追求最高准确率，而是建立一条可靠的基线：

```text
准备数据 → 检查 batch → 定义 CNN → 训练 → 验证 → 保存最佳模型
```

只要这条链路跑通，后续换成自己的猫狗、零件或植物图片，工程结构基本不变。

---

## 项目目标

我们使用 CIFAR-10 数据集。它包含 10 类 32×32 彩色图片：

```python
classes = (
    "plane", "car", "bird", "cat", "deer",
    "dog", "frog", "horse", "ship", "truck"
)
```

输入与输出约定：

| 对象 | Shape | 含义 |
|---|---|---|
| 图片 | `[B, 3, 32, 32]` | 一批 RGB 图片 |
| 标签 | `[B]` | 0～9 的类别编号 |
| logits | `[B, 10]` | 每张图对 10 个类别的原始分数 |

<figure class="lesson-map">
  <img src="/images/covers/first-cnn-image-classification.png" alt="第 66 课知识图，展示 CIFAR-10 数据准备、CNN 定义、训练验证和最佳模型保存流程。" width="1400" height="800" loading="lazy" />
  <figcaption>第 66 课知识地图：第一个 CNN 图像分类训练项目</figcaption>
</figure>

> **看图抓主线：** 准备数据 → 定义 CNN → 训练与验证 → 保存最佳模型。

<details>
<summary>看图自测：点击检查自己能否复述这条主线</summary>

先遮住上面的正文，只看图回答：

1. 这一课的输入是什么？
2. 中间最关键的变化发生在哪里？
3. 最终输出或判断标准是什么？
4. 哪一步最容易出错，为什么？

能用自己的话串起四张卡片，就说明你已经抓住了本课骨架。再回到正文补充公式、代码和边界条件。

</details>

---

## 第一步：准备数据

```python
import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

train_transform = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.4914, 0.4822, 0.4465),
        std=(0.2470, 0.2435, 0.2616),
    ),
])

val_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.4914, 0.4822, 0.4465),
        std=(0.2470, 0.2435, 0.2616),
    ),
])

train_dataset = datasets.CIFAR10(
    root="data",
    train=True,
    download=True,
    transform=train_transform,
)
val_dataset = datasets.CIFAR10(
    root="data",
    train=False,
    download=True,
    transform=val_transform,
)

train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    num_workers=0,
)
val_loader = DataLoader(
    val_dataset,
    batch_size=256,
    shuffle=False,
    num_workers=0,
)
```

两点不要混：

- 训练集 `shuffle=True`，每轮改变样本顺序。
- 验证集 `shuffle=False`，因为不需要打乱，也方便错误样本追踪。

先检查一个 batch：

```python
images, labels = next(iter(train_loader))
print(images.shape)   # [128, 3, 32, 32]
print(labels.shape)   # [128]
print(labels.min(), labels.max())  # tensor(0) tensor(9)
```

---

## 第二步：定义一个够用的 CNN

```python
import torch.nn as nn

class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )

    def forward(self, x):
        return self.block(x)

class CifarCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            ConvBlock(3, 32),    # [B, 3, 32, 32] -> [B, 32, 16, 16]
            ConvBlock(32, 64),   # -> [B, 64, 8, 8]
            ConvBlock(64, 128),  # -> [B, 128, 4, 4]
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)
```

用假数据做接口测试：

```python
model = CifarCNN()
test_output = model(torch.randn(8, 3, 32, 32))
assert test_output.shape == (8, 10)
```

这一步非常重要。模型连 Shape 都没有验证，就直接跑一整轮数据，会让排错成本变高。

---

## 第三步：写训练一个 epoch 的函数

```python
def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    loss_sum = 0.0
    correct = 0
    sample_count = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        batch_size = labels.size(0)
        loss_sum += loss.item() * batch_size
        correct += (logits.argmax(dim=1) == labels).sum().item()
        sample_count += batch_size

    return {
        "loss": loss_sum / sample_count,
        "accuracy": correct / sample_count,
    }
```

为什么 `loss.item()` 要乘 `batch_size`？因为最后一个 batch 可能不足 128。按样本数加权，得到的才是严格的全数据集平均 loss。

---

## 第四步：写验证函数

```python
@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    loss_sum = 0.0
    correct = 0
    sample_count = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        logits = model(images)
        loss = criterion(logits, labels)

        batch_size = labels.size(0)
        loss_sum += loss.item() * batch_size
        correct += (logits.argmax(dim=1) == labels).sum().item()
        sample_count += batch_size

    return {
        "loss": loss_sum / sample_count,
        "accuracy": correct / sample_count,
    }
```

验证和训练有三个区别：

1. `model.eval()`：Dropout 和 BatchNorm 切换到评估行为。
2. 不调用 `backward()` 和 `optimizer.step()`。
3. `@torch.no_grad()`：不记录梯度，节省显存和计算。

---

## 第五步：串起完整训练流程

```python
from pathlib import Path

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CifarCNN(num_classes=10).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=1e-4,
)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=20,
)

Path("checkpoints").mkdir(exist_ok=True)
best_val_acc = 0.0

for epoch in range(1, 21):
    train_metrics = train_one_epoch(
        model, train_loader, criterion, optimizer, device
    )
    val_metrics = evaluate(
        model, val_loader, criterion, device
    )
    scheduler.step()

    print(
        f"Epoch {epoch:02d} | "
        f"train loss {train_metrics['loss']:.4f}, "
        f"train acc {train_metrics['accuracy']:.2%} | "
        f"val loss {val_metrics['loss']:.4f}, "
        f"val acc {val_metrics['accuracy']:.2%}"
    )

    if val_metrics["accuracy"] > best_val_acc:
        best_val_acc = val_metrics["accuracy"]
        torch.save(
            {
                "model_state": model.state_dict(),
                "optimizer_state": optimizer.state_dict(),
                "epoch": epoch,
                "val_accuracy": best_val_acc,
                "classes": classes,
            },
            "checkpoints/best.pt",
        )
```

保存“验证集准确率最高”的权重，而不是默认保存最后一轮。最后一轮可能已经开始过拟合。

---

## 为什么最后一层不写 Softmax

`nn.CrossEntropyLoss` 接收原始 logits，并在内部完成 `LogSoftmax + NLLLoss`。训练时手动加 Softmax 反而会造成重复计算和数值稳定性下降。

```python
# 训练：直接输出 logits
logits = model(images)
loss = criterion(logits, labels)

# 展示概率时才做 softmax
probabilities = logits.softmax(dim=1)
confidence, prediction = probabilities.max(dim=1)
```

---

## 加载最佳模型并预测

```python
checkpoint = torch.load(
    "checkpoints/best.pt",
    map_location=device,
    weights_only=False,
)
model.load_state_dict(checkpoint["model_state"])
model.eval()

images, labels = next(iter(val_loader))
images = images.to(device)

with torch.no_grad():
    logits = model(images)
    probabilities = logits.softmax(dim=1)
    confidence, predictions = probabilities.max(dim=1)

for i in range(5):
    print(
        f"真实={classes[labels[i]]}, "
        f"预测={classes[predictions[i]]}, "
        f"置信度={confidence[i].item():.2%}"
    )
```

这里的置信度只是模型输出概率，不等于“模型有 90% 的客观把握”。神经网络可能过度自信，后面做模型评估时还要结合错误样本分析。

---

## 训练日志应该怎么看

| 现象 | 可能含义 |
|---|---|
| train loss 和 val loss 都下降 | 正常学习 |
| train acc 上升，val acc 长期不动 | 可能过拟合或数据分布不同 |
| loss 一直约为 `ln(10)=2.3026` | 接近随机猜测，检查代码和学习率 |
| loss 变成 NaN | 学习率过大、数据异常或梯度爆炸 |
| train acc、val acc 都低 | 欠拟合、训练不足或模型太弱 |

不要只盯着单个数字。至少同时记录训练 loss、训练 accuracy、验证 loss、验证 accuracy。

---

## 三个高频错误

### 错误 1：验证时忘记 `model.eval()`

BatchNorm 会继续使用当前 batch 的统计量，Dropout 也会随机丢弃神经元，验证指标会不稳定。

### 错误 2：对 logits 先做 Softmax 再交给 CrossEntropyLoss

```python
# 错误
loss = criterion(logits.softmax(dim=1), labels)

# 正确
loss = criterion(logits, labels)
```

### 错误 3：只保存整个 model 对象

更推荐保存 `state_dict` 和必要元数据。它更稳定，也能清楚控制恢复过程。

---

## 课后练习

**练习 1**：把模型第一层通道数从 32 改成 16，写出三次池化后的 Shape。

**练习 2**：为什么验证集不应该使用 `RandomHorizontalFlip()`？

**练习 3**：给训练循环加一个 patience=3 的 Early Stopping：验证 loss 连续三轮没有降低就停止。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：如果后续通道为 32、64，则 Shape 依次是 `[B,16,16,16]`、`[B,32,8,8]`、`[B,64,4,4]`。

**练习 2**：验证集用于稳定比较模型。随机增强会让同一个模型每次评估面对不同输入，使指标波动。

**练习 3**：

```python
best_loss = float("inf")
bad_epochs = 0

if val_metrics["loss"] < best_loss:
    best_loss = val_metrics["loss"]
    bad_epochs = 0
else:
    bad_epochs += 1
    if bad_epochs >= 3:
        print("Early stopping")
        break
```

</details>

---

## 核心要点小结

- 图像分类项目的最小闭环是：数据、模型、训练、验证、保存最佳权重。
- 先用一个 batch 检查 Shape，再开始长时间训练。
- `model.train()` 和 `model.eval()` 决定 Dropout、BatchNorm 的行为。
- CrossEntropyLoss 直接接收 logits，训练阶段不要手动 Softmax。
- loss 应按样本数加权平均，最后一个不足 batch 的数据才不会造成偏差。
- 模型选择看验证集，不能根据测试集反复调参。

下一篇不再只看总体准确率。我们会打开混淆矩阵和错误样本，看看模型究竟把什么认成了什么。
