---
title: 模型评估与交叉验证：不要只相信一次划分
description: 理解训练集、验证集、测试集、交叉验证、平均分和波动，避免用一次随机划分误判模型能力。
cover: /images/covers/model-evaluation-cross-validation-video.jpg
coverAlt: 数据被切成多折，每一折轮流做验证集，用多个分数共同评估模型稳定性。
pubDate: 2026-06-28T09:00:00+08:00
tags: [机器学习, 模型评估, 交叉验证, scikit-learn]
---

前面我们已经学了线性回归、逻辑回归、KNN、决策树和随机森林。到这里，很多人会自然地问：模型训练出来以后，分数到底能不能信？

答案是：**不能只相信一次划分、一次训练、一个分数**。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/model-evaluation-cross-validation-video.jpg" aria-label="第 33 课：模型评估与交叉验证">
    <source src="/videos/lesson-33-model-evaluation-cross-validation.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 33 课视频 · 模型评估与交叉验证：不要只相信一次划分</figcaption>
</figure>

## 为什么一次测试分数不够

假设你把数据按 8:2 切成训练集和测试集，模型在测试集上准确率是 0.86。这个数字看起来不错，但它可能受很多因素影响：

- 这次随机划分刚好比较容易；
- 测试集里某些难样本太少；
- 类别比例和真实场景不一致；
- 数据量太小，分数波动很大；
- 你不小心用测试集反复调参，测试集已经被“看过太多次”。

所以模型评估的目标不是只拿到一个漂亮数字，而是判断：**这个模型在没见过的数据上是否稳定可靠**。

## 训练集、验证集、测试集各做什么

三类数据要分工清楚。

| 数据 | 作用 | 能不能反复看 |
| --- | --- | --- |
| 训练集 | 让模型学习参数 | 可以 |
| 验证集 | 选模型、调参数、比较方案 | 可以，但要有节制 |
| 测试集 | 最后一次客观考试 | 尽量只用一次 |

训练集像课堂练习，验证集像模拟考试，测试集像正式考试。你可以用模拟考试决定怎么复习，但不能一边正式考试一边改答案。

## 交叉验证是什么

交叉验证的核心是：**把数据分成多份，每一份轮流当验证集**。

以 5 折交叉验证为例：

```text
第 1 次：第 1 折做验证，其余 4 折训练
第 2 次：第 2 折做验证，其余 4 折训练
第 3 次：第 3 折做验证，其余 4 折训练
第 4 次：第 4 折做验证，其余 4 折训练
第 5 次：第 5 折做验证，其余 4 折训练
```

最后你会得到 5 个分数。相比一次划分，一个平均分加一个波动范围更有参考价值。

## 看平均分，也要看波动

交叉验证通常会输出多个分数。例如：

```text
[0.82, 0.86, 0.84, 0.83, 0.85]
```

平均分是模型整体表现，标准差代表不同折之间的波动。

- 平均分高、波动小：比较稳；
- 平均分高、波动大：可能对数据划分敏感；
- 平均分低、波动小：稳定但能力不足；
- 平均分低、波动大：模型和数据都需要重新检查。

实际汇报时，不要只写“准确率 0.85”，更好的写法是：

```text
5 折交叉验证 accuracy = 0.84 ± 0.02
```

## sklearn 代码示例

下面用随机森林和鸢尾花数据集做 5 折交叉验证。

```python
import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

X, y = load_iris(return_X_y=True)

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
)

scores = cross_val_score(
    model,
    X,
    y,
    cv=5,
    scoring="accuracy",
    n_jobs=-1,
)

print("每折分数:", scores)
print(f"平均分: {scores.mean():.4f}")
print(f"标准差: {scores.std():.4f}")
```

`cv=5` 表示 5 折交叉验证。`scoring="accuracy"` 表示使用准确率作为评估指标。

## 分类任务不一定只看 accuracy

准确率很直观，但类别不平衡时可能骗人。

假设 1000 条样本里 990 条是正常邮件，10 条是垃圾邮件。一个模型永远预测“正常”，准确率也能达到 99%，但它完全没有抓住垃圾邮件。

这时更应该看：

- Precision：预测为正的样本里，有多少是真的正；
- Recall：真实正样本里，有多少被找出来；
- F1：Precision 和 Recall 的综合；
- ROC-AUC：排序能力；
- 混淆矩阵：每个类别错在哪里。

评估指标要服务于任务代价。垃圾邮件、风控、医疗筛查、推荐系统，关心的指标不一定相同。

## cross_validate：一次看多个指标

如果想同时看多个指标，可以用 `cross_validate`：

```python
from sklearn.model_selection import cross_validate

result = cross_validate(
    model,
    X,
    y,
    cv=5,
    scoring=["accuracy", "f1_macro"],
    return_train_score=True,
)

print("验证 accuracy:", result["test_accuracy"])
print("验证 f1_macro:", result["test_f1_macro"])
print("训练 accuracy:", result["train_accuracy"])
```

`return_train_score=True` 可以帮助你比较训练分数和验证分数。如果训练分数很高，验证分数明显低，通常要警惕过拟合。

## 交叉验证和最终测试集的关系

交叉验证不是测试集的替代品。更稳妥的流程是：

1. 先留出一份测试集，暂时不要碰；
2. 在训练集内部做交叉验证，比较模型和参数；
3. 选好方案后，用全部训练集重新训练；
4. 最后只在测试集上评估一次。

这样做可以减少“调参过程中污染测试集”的风险。

## 常见错误

### 用测试集调参

测试集一旦被反复使用，就不再客观。你以为是在提高模型，其实是在适应测试集。

### 只看平均分不看波动

两个模型平均分都为 0.86，但一个标准差 0.01，另一个标准差 0.08，稳定性完全不同。

### 交叉验证前就对全量数据做预处理

如果你在全量数据上先 `fit` 标准化器或 TF-IDF，再做交叉验证，就可能发生数据泄漏。正确做法是使用 Pipeline，让每一折只在训练折里 `fit` 预处理器。

## 课后练习

把示例模型换成 `DecisionTreeClassifier(max_depth=None)`，再和 `RandomForestClassifier` 比较 5 折交叉验证的平均分和标准差。观察单棵树和随机森林谁更稳定。

## 本课总结

- 一次划分得到的分数可能受随机性影响；
- 交叉验证能用多个分数评估模型稳定性；
- 评估时既看平均分，也看波动；
- 分类任务不要只迷信 accuracy；
- 测试集应该尽量保留到最后一次使用。

下一课我们学习 GridSearchCV。它会把交叉验证和参数搜索结合起来，帮我们系统地寻找更合适的模型参数。
