---
title: KNN 分类：让距离最近的样本帮忙投票
description: 理解 K 近邻算法的核心思想、距离度量、K 值选择、特征缩放和 sklearn 训练流程。
cover: /images/covers/knn-classification-video.jpg
coverAlt: 一个待分类样本被周围最近的 K 个邻居围住，邻居通过投票决定它的类别。
pubDate: 2026-06-27T09:00:00+08:00
tags: [机器学习, KNN, 分类, scikit-learn]
---

学完逻辑回归后，我们已经见过一种“先学习一组参数，再用公式预测”的分类模型。KNN 的思路完全不一样：它几乎不在训练阶段学习参数，而是在预测时临时去看“离我最近的样本都是什么类别”。

一句话理解 KNN：**新样本属于哪一类，先看它附近的 K 个老样本怎么投票**。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/knn-classification-video.jpg" aria-label="第 30 课：KNN 分类">
    <source src="/videos/lesson-30-knn-classification.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 30 课视频 · KNN 分类：让距离最近的样本帮忙投票</figcaption>
</figure>

## KNN 在做什么

假设我们想根据电影的“打斗镜头数”和“接吻镜头数”判断电影类型。历史数据里已经有一些标好标签的电影，新电影来了以后，KNN 会做三件事：

1. 计算新电影和每部历史电影的距离；
2. 找出距离最近的 K 部电影；
3. 看这 K 部电影里哪个类型最多，就把新电影判成哪个类型。

如果 K=3，最近的三部电影分别是“动作片、动作片、爱情片”，那么投票结果就是动作片。这个过程很直观，所以 KNN 经常适合作为初学者理解分类任务的第一批算法。

## 训练很轻，预测较重

很多模型的训练阶段比较重：比如逻辑回归要反复优化参数，神经网络要进行多轮前向传播和反向传播。KNN 不一样，它的 `fit()` 更像是把训练数据保存起来。

真正的工作发生在 `predict()`：

- 预测一个样本时，要计算它和训练集中很多样本的距离；
- 训练数据越多，预测时要比较的对象越多；
- 特征维度越高，距离计算越费劲，距离本身也可能变得不稳定。

这就是为什么 KNN 看起来简单，但在大数据量、高维数据场景下不一定高效。

## 距离为什么重要

KNN 的核心是“近”。问题是，近不近由距离决定。最常见的是欧氏距离：

```text
distance = sqrt((x1 - y1)^2 + (x2 - y2)^2 + ...)
```

如果只有两个特征，可以把样本想象成平面上的点。两个点之间越近，模型就认为它们越相似。

但这里有一个很容易踩的坑：**特征量纲会影响距离**。

比如预测房屋类型时：

- 面积范围可能是 40 到 200 平方米；
- 房间数量可能是 1 到 5 间。

如果直接计算距离，面积这个特征的数值跨度更大，它会在距离里占主导。房间数量虽然也重要，却可能被面积“盖住”。所以 KNN 通常需要标准化或归一化。

## 为什么 KNN 通常要做特征缩放

特征缩放的目标不是让模型“更高级”，而是让不同特征在距离计算中更公平。

常见做法有两种：

| 方法 | 结果 | 常见场景 |
| --- | --- | --- |
| 标准化 StandardScaler | 均值约为 0，标准差约为 1 | 通用、常配合 KNN/SVM/线性模型 |
| 归一化 MinMaxScaler | 缩放到 0 到 1 | 明确希望特征落在固定范围时 |

注意，缩放器必须只在训练集上 `fit`，测试集只能 `transform`。如果你在测试集上重新 `fit`，就会让测试集信息提前泄漏进预处理过程，评估结果会虚高。

## K 值怎么选

K 是 KNN 最核心的超参数。

- K 太小：模型容易受噪声影响。比如 K=1 时，只要最近的样本标错了，新样本就会跟着错。
- K 太大：模型会变得迟钝。邻居范围太大时，远处样本也参与投票，局部差异会被抹平。
- K 通常取奇数：二分类时可以减少平票。

实际项目里不要凭感觉拍脑袋，建议在验证集或交叉验证里比较多个 K 值，例如 3、5、7、9、11，再选择表现稳定的那个。

## sklearn 代码示例

下面用鸢尾花数据集演示 KNN 分类。重点看 Pipeline：它把标准化和模型放在一起，避免训练、测试流程不一致。

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report

X, y = load_iris(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

pipe = Pipeline(steps=[
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5, weights="distance")),
])

pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)

print("测试集准确率:", pipe.score(X_test, y_test))
print(classification_report(y_test, y_pred))
```

这里的 `weights="distance"` 表示距离越近的邻居投票权重越高。默认的 `uniform` 是每个邻居一票，`distance` 则更相信近处的样本。

## KNN 和 K-Means 不要混淆

名字都带 K，很容易混。

| 算法 | 任务类型 | 是否需要标签 | 核心动作 |
| --- | --- | --- | --- |
| KNN | 监督学习 | 需要 | 找最近邻并投票 |
| K-Means | 无监督学习 | 不需要 | 把样本聚成 K 组 |

KNN 是拿带标签的历史样本预测新样本。K-Means 是在没有标签时，把数据自动分组。一个是分类或回归算法，一个是聚类算法。

## KNN 的优点和局限

KNN 的优点是直观、容易实现、几乎没有训练成本，对非线性边界也有一定表达能力。只要数据局部结构清晰，它就能给出不错的结果。

但它也有明显局限：

- 对特征缩放敏感；
- 对无关特征敏感；
- 预测速度可能较慢；
- 高维数据中“距离”会变得不那么可靠；
- 类别不平衡时，多数类更容易占投票优势。

所以 KNN 很适合理解“基于样本相似度的预测”，但并不总是生产环境的首选模型。

## 常见错误

### 忘记做缩放

只要模型依赖距离，就要优先检查特征尺度。KNN、SVM、K-Means、神经网络输入通常都需要关注缩放。

### 在测试集上 fit 缩放器

正确流程是：

```python
scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

使用 Pipeline 后，sklearn 会帮你把这件事封装好。

### 只试一个 K 值

KNN 的效果很依赖 K。至少比较几个候选值，再结合验证集结果选择。

## 课后练习

把示例代码里的 `n_neighbors` 分别改成 `1`、`3`、`5`、`9`，记录测试集准确率。再把 `weights` 从 `"distance"` 改成 `"uniform"`，观察结果有没有变化。

## 本课总结

- KNN 通过“最近邻投票”完成分类；
- 它训练轻、预测重；
- KNN 对距离敏感，所以通常需要特征缩放；
- K 值太小容易受噪声影响，太大容易过度平滑；
- KNN 是监督学习，K-Means 是无监督聚类，二者不要混淆。

下一课我们学习决策树。它不再用“距离”判断相似，而是像做问卷一样，连续提出一系列问题，把样本一步步分到叶节点。
