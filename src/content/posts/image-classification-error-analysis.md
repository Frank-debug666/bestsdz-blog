---
title: "图像分类错误分析：混淆矩阵与错误样本"
description: "准确率只能告诉你错了多少，混淆矩阵和错误样本才能告诉你错在哪里。这篇建立一套从类别指标、混淆矩阵到高置信度错误图的分析流程。"
cover: /images/covers/image-classification-error-analysis.png
coverAlt: "第 67 课知识图，展示从混淆矩阵、错误样本到错误归因和改进策略的分析流程。"
pubDate: 2026-07-27T09:40:00+08:00
tags: [PyTorch, 图像分类, 混淆矩阵, 错误分析, 模型评估, 可视化]
---

假设两个图像分类模型的准确率都是 82%，它们真的一样好吗？

- 模型 A 在每个类别上都比较稳定。
- 模型 B 几乎认不出猫，却在汽车类别上特别强。

一个总准确率看不出这种区别。模型上线前，我们需要继续追问：

1. 哪些类别最容易混淆？
2. 错误来自数据、标签，还是模型能力？
3. 模型最自信的错误是什么？
4. 下一轮该补数据，还是改网络？

---

## 准确率为什么不够

准确率定义为：

$$Accuracy = \frac{预测正确的样本数}{总样本数}$$

如果数据类别不均衡，准确率甚至会很有欺骗性。例如 1000 张图片中有 900 张是猫，一个永远预测“猫”的模型也有 90% 准确率。

因此评估至少要分三层：

```text
总体指标
  ↓
每个类别的表现
  ↓
具体错误样本
```

<figure class="lesson-map">
  <img src="/images/covers/image-classification-error-analysis.png" alt="第 67 课知识图，展示从混淆矩阵、错误样本到错误归因和改进策略的分析流程。" width="1400" height="800" loading="lazy" />
  <figcaption>第 67 课知识地图：图像分类错误分析：混淆矩阵与错误样本</figcaption>
</figure>

> **看图抓主线：** 生成混淆矩阵 → 定位错误样本 → 分析错误来源 → 制定改进策略。

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

## 第一步：收集预测结果

沿用上一篇训练好的 CNN：

```python
import torch

@torch.no_grad()
def collect_predictions(model, loader, device):
    model.eval()
    all_labels = []
    all_predictions = []
    all_confidences = []
    all_images = []

    for images, labels in loader:
        logits = model(images.to(device))
        probabilities = logits.softmax(dim=1)
        confidence, prediction = probabilities.max(dim=1)

        all_images.append(images.cpu())
        all_labels.append(labels.cpu())
        all_predictions.append(prediction.cpu())
        all_confidences.append(confidence.cpu())

    return {
        "images": torch.cat(all_images),
        "labels": torch.cat(all_labels),
        "predictions": torch.cat(all_predictions),
        "confidences": torch.cat(all_confidences),
    }

results = collect_predictions(model, val_loader, device)
```

验证 DataLoader 必须 `shuffle=False`。这样结果顺序与数据集顺序一致，后面才能定位原始文件。

---

## 第二步：计算混淆矩阵

混淆矩阵的第 `i` 行代表真实类别，第 `j` 列代表预测类别：

```text
                  预测
              cat  dog  bird
真实 cat       80   15     5
     dog       20   70    10
     bird       4    6    90
```

对角线是正确预测；非对角线说明“把什么错认成了什么”。

```python
from sklearn.metrics import confusion_matrix

cm = confusion_matrix(
    results["labels"].numpy(),
    results["predictions"].numpy(),
)
print(cm)
```

为了比较不同类别，更推荐按行归一化：

```python
cm_normalized = cm / cm.sum(axis=1, keepdims=True).clip(min=1)
```

归一化后，第 `i` 行之和为 1，可以理解为真实类别 `i` 的样本被分配到了哪些预测类别。

---

## 第三步：把混淆矩阵画出来

```python
import matplotlib.pyplot as plt
import seaborn as sns

def plot_confusion_matrix(cm, class_names):
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt=".2f",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.xlabel("Predicted label")
    plt.ylabel("True label")
    plt.title("Normalized confusion matrix")
    plt.tight_layout()
    plt.show()

plot_confusion_matrix(cm_normalized, classes)
```

读图时不要只看颜色最深的格子。按这个顺序看：

1. 对角线较浅的行：哪些真实类别最难识别？
2. 非对角线较深的格子：最严重的混淆对是什么？
3. 是否存在某一列普遍偏深：模型是否偏爱预测某个类别？

---

## 第四步：计算每类召回率

第 `i` 类的召回率就是归一化混淆矩阵对角线：

```python
import numpy as np

recall_per_class = np.diag(cm_normalized)
for class_name, recall in zip(classes, recall_per_class):
    print(f"{class_name:>8s}: recall={recall:.2%}")
```

如果某一类召回率很低，常见原因有：

- 这一类训练样本太少。
- 标签存在错误。
- 与另一类视觉特征太相似。
- 图片裁剪方式破坏了关键区域。
- 模型容量不足，尚未学到细粒度特征。

---

## 第五步：找出高置信度错误

最值得先看的，不是模型犹豫的错误，而是“非常自信却预测错”的样本。它们往往暴露标签问题、数据偏差或系统性缺陷。

```python
wrong_mask = results["predictions"] != results["labels"]
wrong_indices = torch.where(wrong_mask)[0]

wrong_confidences = results["confidences"][wrong_indices]
order = torch.argsort(wrong_confidences, descending=True)
top_wrong_indices = wrong_indices[order[:12]]

for idx in top_wrong_indices[:5]:
    idx = idx.item()
    true_id = results["labels"][idx].item()
    pred_id = results["predictions"][idx].item()
    confidence = results["confidences"][idx].item()
    print(
        f"index={idx}, true={classes[true_id]}, "
        f"pred={classes[pred_id]}, confidence={confidence:.2%}"
    )
```

---

## 第六步：可视化错误图片

如果图片经过 Normalize，显示前要先反归一化：

```python
MEAN = torch.tensor([0.4914, 0.4822, 0.4465]).view(3, 1, 1)
STD = torch.tensor([0.2470, 0.2435, 0.2616]).view(3, 1, 1)

def denormalize(image):
    return (image * STD + MEAN).clamp(0, 1)

def show_errors(results, indices, class_names):
    fig, axes = plt.subplots(3, 4, figsize=(12, 9))

    for ax, idx in zip(axes.flat, indices):
        idx = idx.item() if torch.is_tensor(idx) else idx
        image = denormalize(results["images"][idx]).permute(1, 2, 0)
        true_id = results["labels"][idx].item()
        pred_id = results["predictions"][idx].item()
        confidence = results["confidences"][idx].item()

        ax.imshow(image)
        ax.set_title(
            f"true: {class_names[true_id]}\n"
            f"pred: {class_names[pred_id]} ({confidence:.0%})",
            color="crimson",
        )
        ax.axis("off")

    plt.tight_layout()
    plt.show()

show_errors(results, top_wrong_indices, classes)
```

看到图片后，给错误分类，不要只说“模型不行”：

| 错误类型 | 现象 | 下一步 |
|---|---|---|
| 标签错误 | 图片明显是狗，标签却是猫 | 清洗标签 |
| 图片质量差 | 模糊、遮挡、目标太小 | 补数据或改裁剪 |
| 类别边界模糊 | 猫和狗外观相似 | 增强模型或细化标注规范 |
| 背景捷径 | 模型靠草地判断“鹿” | 增加背景多样性 |
| 分布偏移 | 验证图风格与训练图不同 | 重做数据划分 |

---

## 分析最严重的混淆对

```python
cm_without_diagonal = cm_normalized.copy()
np.fill_diagonal(cm_without_diagonal, 0)

flat_index = cm_without_diagonal.argmax()
true_id, pred_id = np.unravel_index(
    flat_index, cm_without_diagonal.shape
)

print(
    f"最严重混淆：真实 {classes[true_id]} "
    f"被预测为 {classes[pred_id]}，比例 "
    f"{cm_without_diagonal[true_id, pred_id]:.2%}"
)
```

接着筛选这一对样本：

```python
pair_mask = (
    (results["labels"] == true_id)
    & (results["predictions"] == pred_id)
)
pair_indices = torch.where(pair_mask)[0][:12]
show_errors(results, pair_indices, classes)
```

这比漫无目的地浏览全部错误有效得多。

---

## 从分析结果决定下一轮实验

错误分析最终要落到可验证的实验，而不是停在截图。

```text
观察：cat 经常被预测为 dog
假设：低分辨率下耳朵和脸部细节不足
改动：输入从 32×32 提升到 64×64，并增加一个卷积块
验证：比较 cat recall、总体 accuracy 和推理速度
```

每次尽量只改变一个主要变量。否则指标变好后，你不知道究竟是哪一项起作用。

---

## 三个高频错误

### 错误 1：混淆矩阵行列含义记反

先明确约定：`sklearn.metrics.confusion_matrix(y_true, y_pred)` 的行是真实标签，列是预测标签。

### 错误 2：只画原始计数，不看归一化比例

样本多的类别天然颜色更深。类别不均衡时，必须同时看原始数量和按行归一化结果。

### 错误 3：错误图片显示成奇怪颜色

通常是忘了反归一化，或把 `[C,H,W]` 直接交给 `imshow`。显示前使用：

```python
image = denormalize(image).permute(1, 2, 0)
```

---

## 课后练习

**练习 1**：如果混淆矩阵中“真实 cat、预测 dog”占 30%，这 30% 是 precision 还是 recall 视角？

**练习 2**：为什么高置信度错误比低置信度错误更值得优先查看？

**练习 3**：给错误样本分析增加“每个类别各展示 5 张错误图”的功能。

<details>
<summary>参考答案 / 自检思路</summary>

**练习 1**：按真实类别所在行归一化，因此是 cat 的 recall 视角：30% 的真实 cat 被漏掉并预测成 dog。

**练习 2**：低置信度错误可能只是边界样本；高置信度错误说明模型形成了强烈但错误的规律，更可能暴露标签错误、数据偏差或捷径学习。

**练习 3**：依次遍历 `true_id`，筛选 `(labels == true_id) & (predictions != true_id)`，再按 confidence 排序取前 5 个。

</details>

---

## 核心要点小结

- 总准确率只回答“错了多少”，混淆矩阵回答“把什么错成了什么”。
- 按行归一化后，对角线就是每个类别的召回率。
- 优先查看高置信度错误和最严重混淆对。
- 错误样本要继续分成标签、图像质量、类别边界、背景捷径和分布偏移。
- 每个观察都应转化成一个可以对照验证的下一轮实验。

下一篇我们把第 59～67 篇中反复出现的数据、模型、训练、验证、日志与保存流程，整理成一个可复用的深度学习项目模板。
