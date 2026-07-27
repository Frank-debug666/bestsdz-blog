---
title: "深度学习项目标准模板：训练、验证、日志和配置"
description: "把散落在单文件里的 PyTorch 代码整理成可维护项目：配置、数据、模型、训练引擎、日志、检查点和推理各归其位，并保留可复现实验所需信息。"
cover: /images/covers/deep-learning-project-template.png
coverAlt: "第 68 课知识图，展示项目配置、训练引擎、实验日志和模板复用之间的关系。"
pubDate: 2026-07-27T10:00:00+08:00
tags: [PyTorch, 项目结构, 训练模板, 配置管理, 日志, 可复现]
---

第一个模型通常写在一个 Notebook 或一个 `train.py` 里，这没有问题。但项目一旦继续增长，单文件会很快变成这样：

- 数据增强散落在训练代码中。
- 模型类和日志打印混在一起。
- 修改一次学习率，却忘了保存本次配置。
- 最佳权重、最后权重和推理权重分不清。
- 一个月后连自己都无法复现实验。

项目模板不是为了“看起来专业”，而是为了让每一次实验都能回答三个问题：

1. 当时用了什么数据、模型和超参数？
2. 训练过程发生了什么？
3. 怎样稳定地恢复并推理？

---

## 一个够用的目录结构

```text
image-classification/
├── configs/
│   └── default.yaml
├── data/
│   ├── train/
│   └── val/
├── outputs/
│   └── experiment-001/
│       ├── config.yaml
│       ├── metrics.csv
│       └── best.pt
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── datasets.py
│   ├── models.py
│   ├── engine.py
│   └── utils.py
├── train.py
├── predict.py
└── requirements.txt
```

<figure class="lesson-map">
  <img src="/images/covers/deep-learning-project-template.png" alt="第 68 课知识图，展示项目配置、训练引擎、实验日志和模板复用之间的关系。" width="1400" height="800" loading="lazy" />
  <figcaption>第 68 课知识地图：深度学习项目标准模板：训练、验证、日志和配置</figcaption>
</figure>

> **看图抓主线：** 整理项目配置 → 封装训练引擎 → 记录实验日志 → 复用项目模板。

<details>
<summary>看图自测：点击检查自己能否复述这条主线</summary>

先遮住上面的正文，只看图回答：

1. 这一课的输入是什么？
2. 中间最关键的变化发生在哪里？
3. 最终输出或判断标准是什么？
4. 哪一步最容易出错，为什么？

能用自己的话串起四张卡片，就说明你已经抓住了本课骨架。再回到正文补充公式、代码和边界条件。

</details>

每个模块只承担一个主要职责：

| 文件 | 职责 |
|---|---|
| `config.py` | 读取和校验超参数 |
| `datasets.py` | 数据集、变换和 DataLoader |
| `models.py` | 模型结构 |
| `engine.py` | 训练和验证一个 epoch |
| `utils.py` | 随机种子、日志、保存权重 |
| `train.py` | 组合所有模块并启动训练 |
| `predict.py` | 独立加载权重做推理 |

---

## 配置应该从代码里搬出来

一个最小的 `configs/default.yaml`：

```yaml
experiment_name: cifar10-cnn-v1
seed: 42

data:
  root: data
  image_size: 32
  batch_size: 128
  num_workers: 0

model:
  num_classes: 10
  dropout: 0.3

train:
  epochs: 20
  learning_rate: 0.001
  weight_decay: 0.0001
  device: auto
```

配置文件的价值不是少写几行 Python，而是让实验参数可以被保存、比较和复用。

```python
# src/config.py
from dataclasses import dataclass
from pathlib import Path
import yaml

@dataclass
class Config:
    raw: dict

    @property
    def experiment_name(self):
        return self.raw["experiment_name"]

def load_config(path):
    path = Path(path)
    with path.open("r", encoding="utf-8") as file:
        raw = yaml.safe_load(file)

    required = {"experiment_name", "seed", "data", "model", "train"}
    missing = required - raw.keys()
    if missing:
        raise ValueError(f"配置缺少字段: {sorted(missing)}")

    return Config(raw=raw)
```

大型项目可以使用专门的配置框架；学习阶段先把“配置与实现分离”的习惯建立起来更重要。

---

## 数据模块只负责返回 DataLoader

```python
# src/datasets.py
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

def build_loaders(config):
    data_cfg = config.raw["data"]
    image_size = data_cfg["image_size"]

    train_transform = transforms.Compose([
        transforms.RandomCrop(image_size, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
    ])
    val_transform = transforms.ToTensor()

    train_dataset = datasets.CIFAR10(
        root=data_cfg["root"],
        train=True,
        download=True,
        transform=train_transform,
    )
    val_dataset = datasets.CIFAR10(
        root=data_cfg["root"],
        train=False,
        download=True,
        transform=val_transform,
    )

    common = {
        "num_workers": data_cfg["num_workers"],
        "pin_memory": True,
    }
    train_loader = DataLoader(
        train_dataset,
        batch_size=data_cfg["batch_size"],
        shuffle=True,
        **common,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=data_cfg["batch_size"] * 2,
        shuffle=False,
        **common,
    )
    return train_loader, val_loader
```

`train.py` 不需要知道图片怎样裁剪；它只拿到可迭代的 loader。

---

## 模型模块提供统一构建入口

```python
# src/models.py
import torch.nn as nn

class SmallCNN(nn.Module):
    def __init__(self, num_classes=10, dropout=0.3):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))

def build_model(config):
    model_cfg = config.raw["model"]
    return SmallCNN(
        num_classes=model_cfg["num_classes"],
        dropout=model_cfg["dropout"],
    )
```

这里使用 `AdaptiveAvgPool2d(1)`，把任意空间尺寸压成 1×1，减少 `Linear` 与输入图片尺寸的耦合。

---

## 训练引擎不要负责创建模型

```python
# src/engine.py
import torch

def run_epoch(model, loader, criterion, device, optimizer=None):
    training = optimizer is not None
    model.train(training)

    loss_sum = 0.0
    correct = 0
    count = 0

    context = torch.enable_grad() if training else torch.no_grad()
    with context:
        for images, labels in loader:
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            if training:
                optimizer.zero_grad()

            logits = model(images)
            loss = criterion(logits, labels)

            if training:
                loss.backward()
                optimizer.step()

            batch_size = labels.size(0)
            loss_sum += loss.item() * batch_size
            correct += (logits.argmax(1) == labels).sum().item()
            count += batch_size

    return {
        "loss": loss_sum / count,
        "accuracy": correct / count,
    }
```

同一函数通过是否传入 optimizer 区分训练和验证，避免两套几乎一样的循环长期漂移。

---

## 可复现：先固定能控制的变量

```python
# src/utils.py
import random
import numpy as np
import torch

def seed_everything(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
```

固定随机种子不代表不同硬件、不同 PyTorch 版本一定得到完全相同结果，但能减少无意义波动。

实验记录还应至少保存：

- Python、PyTorch 和 CUDA 版本。
- Git commit 或代码版本。
- 完整配置文件。
- 最佳指标与对应 epoch。
- 类别名和预处理参数。

---

## 指标日志不要只打印在终端

```python
import csv
from pathlib import Path

def append_metrics(path, row):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()

    with path.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=row.keys())
        if not exists:
            writer.writeheader()
        writer.writerow(row)
```

每轮写入：

```python
append_metrics(
    output_dir / "metrics.csv",
    {
        "epoch": epoch,
        "train_loss": train_metrics["loss"],
        "train_accuracy": train_metrics["accuracy"],
        "val_loss": val_metrics["loss"],
        "val_accuracy": val_metrics["accuracy"],
        "learning_rate": optimizer.param_groups[0]["lr"],
    },
)
```

CSV 简单、透明，既能用 Excel 打开，也能用 pandas 和 Matplotlib 画曲线。

---

## 检查点要包含恢复训练所需信息

```python
def save_checkpoint(
    path,
    model,
    optimizer,
    scheduler,
    epoch,
    best_metric,
    config,
):
    torch.save(
        {
            "model_state": model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "scheduler_state": scheduler.state_dict(),
            "epoch": epoch,
            "best_metric": best_metric,
            "config": config.raw,
        },
        path,
    )
```

只做推理时只需模型权重；要继续训练，就还要恢复 optimizer、scheduler、epoch 和最佳指标。

---

## train.py 只做组装

```python
from pathlib import Path
import shutil
import torch
import torch.nn as nn

from src.config import load_config
from src.datasets import build_loaders
from src.engine import run_epoch
from src.models import build_model
from src.utils import seed_everything

def main():
    config_path = Path("configs/default.yaml")
    config = load_config(config_path)
    seed_everything(config.raw["seed"])

    device_name = config.raw["train"]["device"]
    if device_name == "auto":
        device_name = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_name)

    output_dir = Path("outputs") / config.experiment_name
    output_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(config_path, output_dir / "config.yaml")

    train_loader, val_loader = build_loaders(config)
    model = build_model(config).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.raw["train"]["learning_rate"],
        weight_decay=config.raw["train"]["weight_decay"],
    )

    best_accuracy = 0.0
    for epoch in range(1, config.raw["train"]["epochs"] + 1):
        train_metrics = run_epoch(
            model, train_loader, criterion, device, optimizer
        )
        val_metrics = run_epoch(
            model, val_loader, criterion, device
        )

        if val_metrics["accuracy"] > best_accuracy:
            best_accuracy = val_metrics["accuracy"]
            torch.save(model.state_dict(), output_dir / "best.pt")

        print(
            f"{epoch:02d} | "
            f"train {train_metrics['accuracy']:.2%} | "
            f"val {val_metrics['accuracy']:.2%}"
        )

if __name__ == "__main__":
    main()
```

这时 `train.py` 像导演：它不亲自处理每张图片，也不定义每层网络，只负责把模块按配置组织起来。

---

## 推理必须复用训练预处理

`predict.py` 最容易犯的错，是重新“凭记忆”写一套 Resize 和 Normalize。正确做法是从保存的配置或统一函数构建验证变换。

```text
训练时：Resize → ToTensor → Normalize
推理时：必须完全一致
```

否则模型输入分布改变，即使权重正确，预测也可能明显变差。

---

## 三个高频错误

### 错误 1：配置改了，但输出目录里没有副本

几周后你只看到 `best.pt`，却不知道它对应哪个学习率。启动训练时就把配置复制到实验目录。

### 错误 2：用测试集选择最佳模型

验证集用于调参和选模型；测试集只在方案确定后做最终评估。反复看测试集，本质上会对测试集过拟合。

### 错误 3：工具模块变成“杂物间”

`utils.py` 不应塞进所有逻辑。数据处理留在 datasets，模型留在 models，训练逻辑留在 engine；utils 只放真正通用的小工具。

---

## 课后练习

**练习 1**：为配置文件增加 `optimizer.name`，支持在 `AdamW` 和 `SGD` 间切换。

**练习 2**：让训练脚本同时保存 `last.pt` 和 `best.pt`，说明二者用途。

**练习 3**：在每个实验目录生成 `environment.txt`，记录 Python、PyTorch 与 CUDA 版本。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：写 `build_optimizer(config, model)`，读取 name 后分支创建优化器；未知名称应抛出 `ValueError`。

**练习 2**：`last.pt` 每轮覆盖，用于中断恢复；`best.pt` 只在验证指标改善时覆盖，用于部署和最终评估。

**练习 3**：

```python
import platform
import torch

text = (
    f"python={platform.python_version()}\n"
    f"torch={torch.__version__}\n"
    f"cuda={torch.version.cuda}\n"
)
(output_dir / "environment.txt").write_text(text, encoding="utf-8")
```

</details>

---

## 核心要点小结

- 标准项目结构的目标是可维护、可比较、可恢复，不是增加目录数量。
- 配置、代码、指标和权重必须在同一个实验输出中对应起来。
- datasets、models、engine 各自只处理一个主要职责。
- 最佳权重用于评估与部署，最后权重用于恢复训练，二者不要混淆。
- 推理必须复用训练时的验证预处理。
- 固定随机种子、记录环境和代码版本，才能尽量复现实验。

至此，深度学习项目阶段完成。下一篇开始进入自然语言处理：先不急着上 RNN 和 Transformer，我们从最基础的问题开始——一句文字怎样被拆成 Token，并建立成模型能使用的词表。
