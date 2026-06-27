---
title: 决策树是什么？模型怎样一步步做判断
description: 从分支节点、叶节点、基尼系数、信息增益和 max_depth 入手，理解决策树分类模型。
cover: /images/covers/decision-tree-basics-video.jpg
coverAlt: 一棵决策树通过连续判断条件，把样本从根节点分到不同叶节点。
pubDate: 2026-06-27T09:20:00+08:00
tags: [机器学习, 决策树, 分类, scikit-learn]
---

KNN 是“看附近样本怎么投票”，决策树则更像“连续问问题”。每问一个问题，样本就沿着某个分支往下走，直到走到一个叶节点，模型就给出最终类别。

一句话理解决策树：**把复杂判断拆成一连串简单问题**。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/decision-tree-basics-video.jpg" aria-label="第 31 课：决策树基础">
    <source src="/videos/lesson-31-decision-tree-basics.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 31 课视频 · 决策树是什么？模型怎样一步步做判断</figcaption>
</figure>

## 决策树长什么样

决策树由三类结构组成：

- 根节点：整棵树的入口，也是第一个判断问题；
- 分支节点：继续提出问题，把样本分到不同方向；
- 叶节点：不再继续分裂，直接输出预测类别。

例如判断一封邮件是不是垃圾邮件，可以有这样的树：

```text
是否包含中奖关键词？
├── 是：是否包含链接？
│   ├── 是：垃圾邮件
│   └── 否：可疑邮件
└── 否：是否来自联系人？
    ├── 是：正常邮件
    └── 否：普通邮件
```

真实模型不会直接理解“中奖关键词”这种自然语言概念，它看到的是数值特征，例如关键词出现次数、链接数量、发送频率等。决策树会在这些特征上寻找合适的切分条件。

## 树是怎么选择问题的

决策树训练时最核心的问题是：**当前节点应该先问哪个问题，切在哪里？**

一个好的问题，应该让切分后的数据更“纯”。比如一个节点里有 50 个正样本和 50 个负样本，很混乱；切分后左边几乎全是正样本，右边几乎全是负样本，这就是一次好的切分。

常见的切分标准有：

| 标准 | 直观理解 | sklearn 参数 |
| --- | --- | --- |
| Gini 基尼系数 | 节点里类别越混杂，值越高 | `criterion="gini"` |
| Entropy 信息熵 | 不确定性越高，熵越高 | `criterion="entropy"` |

初学阶段不需要死背公式，先记住：决策树会尝试多个特征和阈值，选择能让分类结果更清晰的那个切分。

## 为什么决策树容易过拟合

决策树很强的一点是表达能力高。只要不限制深度，它可以不断提问，把训练集切得非常细，甚至记住训练数据里的偶然噪声。

这也是它的危险之处。

如果一棵树长得太深，训练集准确率可能很高，但测试集效果不一定好。因为它学到的不只是规律，还可能学到了训练集里的巧合。

常见的控制方式包括：

- `max_depth`：限制树最大深度；
- `min_samples_split`：限制内部节点继续分裂所需的最小样本数；
- `min_samples_leaf`：限制叶节点至少包含多少样本；
- `max_leaf_nodes`：限制叶节点数量。

这些参数本质上都在提醒模型：不要把数据切得太碎。

## 决策树是否需要标准化

通常不需要。

KNN 依赖距离，所以数值尺度会影响结果。决策树依赖的是“某个特征是否小于某个阈值”。如果一个特征从厘米换成米，阈值也会跟着变，但样本大小关系没有变，切分逻辑基本不受影响。

这也是树模型在表格数据里很受欢迎的原因之一：它对特征缩放不敏感，能自然处理非线性边界，还能输出特征重要性。

## sklearn 代码示例

下面继续用鸢尾花数据集演示决策树分类。

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report

iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

model = DecisionTreeClassifier(
    max_depth=3,
    criterion="gini",
    random_state=42,
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print("测试集准确率:", model.score(X_test, y_test))
print(classification_report(y_test, y_pred, target_names=iris.target_names))
print("特征重要性:", model.feature_importances_)
```

`feature_importances_` 会给出每个特征的重要性得分，总和为 1。它可以帮助我们粗略理解模型主要依赖哪些特征做判断。

## 如何看一棵树

如果想把树的规则打印出来，可以使用 `export_text`：

```python
from sklearn.tree import export_text

rules = export_text(model, feature_names=iris.feature_names)
print(rules)
```

你会看到类似这样的结构：

```text
|--- petal length <= 2.45
|   |--- class: setosa
|--- petal length >  2.45
|   |--- petal width <= 1.75
|   |   |--- class: versicolor
|   |--- petal width >  1.75
|   |   |--- class: virginica
```

这正是决策树可解释性强的地方。它不像神经网络那样把大量权重藏在矩阵里，而是能把判断路径展示出来。

## 决策树的优点和局限

优点：

- 容易解释；
- 不需要特征缩放；
- 能处理非线性关系；
- 能输出特征重要性；
- 对表格数据很友好。

局限：

- 单棵树容易过拟合；
- 对训练数据的小变化比较敏感；
- 如果不限制深度，树会变得很复杂；
- 单棵树的泛化能力通常不如集成模型稳定。

这也是为什么下一课要学习随机森林：它不是只相信一棵树，而是训练很多棵树，让它们一起投票。

## 常见错误

### 训练集分数很高就以为模型很好

决策树很容易把训练集记住，所以训练分数高并不稀奇。一定要看验证集、测试集或交叉验证结果。

### 不限制树深度

初学时建议先设置 `max_depth`，例如 3、5、7。等你理解数据后，再逐步放开限制。

### 把特征重要性当成因果关系

特征重要性只能说明模型在当前数据和当前训练方式下更依赖哪些特征，不能直接证明“这个特征导致了结果”。

## 课后练习

把代码里的 `max_depth` 分别改成 `1`、`3`、`None`，观察训练集和测试集分数。你会看到树越深，训练集越容易接近满分，但测试集不一定同步变好。

## 本课总结

- 决策树通过连续提问做判断；
- 节点越纯，切分通常越好；
- `gini` 和 `entropy` 都是常见切分标准；
- 决策树通常不需要标准化；
- 单棵树容易过拟合，要用深度、叶节点样本数等参数控制复杂度。

下一课我们学习随机森林。它会训练多棵决策树，通过抽样和投票，让模型比单棵树更稳。
