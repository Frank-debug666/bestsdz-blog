---
title: nn.Module 详解：模型为什么要继承这个类
description: 所有 PyTorch 模型都继承 nn.Module。但你可能不知道，它帮你做了参数注册、子模块管理、train/eval 切换、设备迁移四件大事。这篇把 nn.Module 的黑盒拆开。
cover: /images/covers/nn-module-explained-video.jpg
coverAlt: 第 50 课 nn.Module 详解视频封面，展示参数注册、子模块管理、train eval 切换和设备迁移。
pubDate: 2026-07-09T09:40:00+08:00
tags: [PyTorch, nn.Module, 模型定义, 参数注册, forward]
---

你写模型时永远是这样三步：`class XxxModel(nn.Module)`、`def __init__` 里定义层、`def forward` 里拼数据流。但为什么非得继承 nn.Module？直接写个普通类不行吗？

答案是 nn.Module 帮你干了四件脏活：参数注册、子模块管理、train/eval 模式切换、设备迁移。不继承它，这些你得自己写几百行。这一篇把这套机制讲透。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/nn-module-explained-video.jpg" aria-label="第 50 课：nn.Module 详解">
    <source src="/videos/lesson-50-nn-module-explained.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 50 课视频 - nn.Module 详解：模型为什么要继承这个类</figcaption>
</figure>

---

## 概念回顾

上一篇我们学了 DataLoader 怎么把数据喂进来。现在往下游走——数据进模型。第 16 篇你见过 `nn.Linear`，第 50 篇我们讲它背后的"宿主" nn.Module。第 45 篇的计算图也依赖 nn.Module——因为只有注册在 Module 里的参数，才会被 autograd 跟踪。

---

## 一句话解释

> nn.Module 是所有 PyTorch 模型的基类。继承它，你的层和参数会被自动注册，optimizer 能找到它们，autograd 能跟踪它们，model.to('cuda') 能迁移它们。

---

## 最小模型结构

```python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, in_features, hidden, num_classes):
        super().__init__()                    # ① 必须调用父类初始化
        self.fc1 = nn.Linear(in_features, hidden)   # ② 在 __init__ 里定义层
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden, num_classes)

    def forward(self, x):                     # ③ 定义数据怎么流
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

model = MLP(784, 256, 10)
print(model)
```

输出：

```
MLP(
  (fc1): Linear(in_features=784, out_features=256, bias=True)
  (relu): ReLU()
  (fc2): Linear(in_features=256, out_features=10, bias=True)
)
```

---

## nn.Module 帮你做的四件事

### 1. 参数注册：optimizer 能找到所有参数

当你把 `nn.Linear` 赋值给 `self.fc1` 时，nn.Module 自动把 fc1 的权重和偏置注册到模型里。

```python
model = MLP(784, 256, 10)

# 自动收集所有参数
for name, param in model.named_parameters():
    print(f"{name}: {param.shape}")

# 输出：
# fc1.weight: torch.Size([256, 784])
# fc1.bias: torch.Size([256])
# fc2.weight: torch.Size([10, 256])
# fc2.bias: torch.Size([10])
```

所以 optimizer 只需要一句：

```python
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
```

`model.parameters()` 自动返回所有可训练参数。你不用手动收集。

**陷阱**：如果你这样写，参数不会被注册：

```python
# ❌ 用普通 list 而不是 nn.ModuleList
class BadModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = [nn.Linear(10, 10), nn.Linear(10, 10)]  # 普通 list！

model = BadModel()
print(list(model.parameters()))   # 空列表！optimizer 收不到参数
```

**修复**：用 `nn.ModuleList`：

```python
# ✅ 用 nn.ModuleList
class GoodModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.ModuleList([nn.Linear(10, 10), nn.Linear(10, 10)])

model = GoodModel()
print(list(model.parameters()))   # 有参数了
```

### 2. 子模块管理：嵌套模型

nn.Module 可以包含其他 nn.Module，形成树状结构。

```python
class FeatureExtractor(nn.Module):
    def __init__(self, in_features, hidden):
        super().__init__()
        self.fc = nn.Linear(in_features, hidden)
        self.relu = nn.ReLU()
    def forward(self, x):
        return self.relu(self.fc(x))

class FullModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.extractor = FeatureExtractor(100, 64)   # 嵌套
        self.classifier = nn.Linear(64, 10)
    def forward(self, x):
        x = self.extractor(x)
        return self.classifier(x)

model = FullModel()
print(model)
```

子模块的参数也会被自动收集——`model.parameters()` 能拿到所有层的参数。

### 3. train/eval 模式切换

```python
model.train()   # 训练模式
model.eval()    # 评估模式
```

这影响两层的行为：

| 层 | train() | eval() |
|---|---|---|
| Dropout | 随机丢弃神经元 | 不丢弃 |
| BatchNorm | 用当前 batch 统计 | 用训练时保存的统计 |

**忘记切换是最常见的 bug 之一**：训练时忘 `model.train()`，Dropout 不工作；评估时忘 `model.eval()`，Dropout 还在随机丢弃，评估结果不稳定。

### 4. 设备迁移

```python
model = MLP(784, 256, 10)
model = model.to('cuda')   # 所有参数迁移到 GPU

# 数据也要迁移到同一设备
x = x.to('cuda')
y = y.to('cuda')
logits = model(x)
```

`model.to('cuda')` 会把所有注册的参数和子模块迁移到 GPU。不用你手动一个个搬。

---

## nn.Sequential：简化没有分支的模型

如果模型就是线性的层叠，用 `nn.Sequential` 更简洁：

```python
# 这两种写法等价
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(256, 10)
)

# 等价于
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(784, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 10)
        )
    def forward(self, x):
        return self.net(x)
```

**什么时候用 Sequential，什么时候写 forward？**

- 层叠无分支 → Sequential
- 有条件判断、多输入、残差连接 → 写 forward

```python
# 有残差连接，必须写 forward
class ResBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.fc1 = nn.Linear(dim, dim)
        self.fc2 = nn.Linear(dim, dim)
    def forward(self, x):
        residual = x              # 保存输入
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x + residual       # 残差相加
```

---

## 调用 model(x) 到底发生了什么

你写 `model(x)`，它调用 `model.__call__(x)`，`__call__` 内部调用 `model.forward(x)`。

**不要直接调 `model.forward(x)`**——虽然能跑，但会跳过 nn.Module 的钩子机制（hooks），某些功能会失效。

```python
# 推荐
logits = model(x)

# 不推荐
logits = model.forward(x)   # 跳过了 hooks
```

---

## 三个高频错误

### 错误 1：忘记 super().__init__()

```python
# ❌
class MyModel(nn.Module):
    def __init__(self):
        # 忘了 super().__init__()
        self.fc = nn.Linear(10, 10)

model = MyModel()   # 报错：ParameterList 还没初始化
```

**修复**：第一行加 `super().__init__()`。

### 错误 2：层用 list 存

前面讲过，普通 list 不会注册参数。用 `nn.ModuleList`。

### 错误 3：forward 里创建层

```python
# ❌ 每次 forward 都新建层，参数不共享
class BadModel(nn.Module):
    def __init__(self):
        super().__init__()
    def forward(self, x):
        fc = nn.Linear(10, 10)   # 每次 forward 新建！
        return fc(x)
```

**修复**：层在 `__init__` 里定义，forward 里只做数据流。

---

## 课后练习

**练习 1**：写一个模型，有两个分支——一条全连接路径和一条卷积路径，最后拼接。forward 接收一个参数决定走哪条。

**练习 2**：下面代码能跑吗？训练效果对吗？

```python
class Model(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = [nn.Linear(10, 10) for _ in range(5)]
    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x
```

**练习 3**：怎么查看一个模型总共有多少参数？

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：
```python
class TwoBranchModel(nn.Module):
    def __init__(self, in_dim):
        super().__init__()
        self.fc_branch = nn.Sequential(nn.Linear(in_dim, 32), nn.ReLU())
        # 假设输入是 [B, in_dim]，这里简化卷积分支
        self.conv_branch = nn.Sequential(nn.Linear(in_dim, 32), nn.ReLU())
    def forward(self, x, use_fc=True):
        if use_fc:
            return self.fc_branch(x)
        else:
            return self.conv_branch(x)
```

**练习 2**：能跑（不报错），但训练效果完全不对。因为用普通 list 存层，参数没注册，optimizer 收不到这些层的参数，它们根本不会被训练。改为 `nn.ModuleList`：
```python
self.layers = nn.ModuleList([nn.Linear(10, 10) for _ in range(5)])
```

**练习 3**：
```python
total = sum(p.numel() for p in model.parameters())
print(f"总参数量: {total}")
# 如果只要可训练的：
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
```
</details>

---

## 核心要点小结

- 继承 nn.Module 自动获得参数注册、子模块管理、模式切换、设备迁移
- `__init__` 里定义层，`forward` 里定义数据流——不要反过来
- 层用 list 存会丢参数，用 `nn.ModuleList`
- `model(x)` 调用 `__call__` → `forward`，不要直接调 forward
- train/eval 模式影响 Dropout 和 BatchNorm，别忘切换
- 无分支用 Sequential，有分支/残差写 forward

下一篇讲参数初始化——权重全设 0 会让模型学废，初始化方式直接决定训练能不能起步。
