---
title: 随机森林为什么比单棵树更稳
description: 理解随机森林的 Bagging 思想、有放回抽样、随机特征选择、投票机制和常用参数。
cover: /images/covers/random-forest-basics-video.jpg
coverAlt: 多棵决策树分别给出预测，最终通过多数投票形成随机森林的分类结果。
pubDate: 2026-06-27T09:40:00+08:00
tags: [机器学习, 随机森林, 集成学习, scikit-learn]
---

单棵决策树很容易解释，但也容易过拟合。随机森林的想法很朴素：既然一棵树可能偏，那就训练很多棵树，让它们共同投票。

一句话理解随机森林：**用一群不完全相同的决策树，抵消单棵树的偶然偏差**。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/random-forest-basics-video.jpg" aria-label="第 32 课：随机森林基础">
    <source src="/videos/lesson-32-random-forest-basics.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 32 课视频 · 随机森林为什么比单棵树更稳</figcaption>
</figure>

## 从单棵树到一片森林

决策树的问题是“太敏感”。训练数据稍微变化一点，树的结构可能就会变。某个异常样本、某次偶然划分，都可能影响最终规则。

随机森林通过两种随机性让每棵树都不完全一样：

1. **随机抽样样本**：每棵树从训练集中有放回抽样，拿到的数据子集不同；
2. **随机选择特征**：每次节点分裂时，不是看所有特征，而是随机挑一部分特征进行比较。

每棵树都看到不同的数据、不同的特征候选，因此它们会形成不同判断。最终分类时，多棵树投票；回归时，多棵树取平均。

## Bagging 是什么

随机森林属于 Bagging 思想。Bagging 是 Bootstrap Aggregating 的缩写，可以拆成两步：

- Bootstrap：有放回抽样，生成多份不同的训练子集；
- Aggregating：把多个模型的预测结果汇总起来。

直观上，Bagging 像是让多个专家独立做题，然后统计多数意见。单个专家可能看漏，但一群专家一起投票，结果通常更稳。

## 为什么随机森林能抗过拟合

单棵树的方差高，意思是它容易被训练数据的细节影响。随机森林把多棵树平均或投票，相当于把不同树的波动互相抵消。

但这不代表随机森林永远不会过拟合。树太深、数据噪声太大、类别极度不平衡、特征泄漏明显时，随机森林一样会学偏。它只是比单棵树更稳定，不是万能。

## 常用参数怎么理解

| 参数 | 作用 | 初学建议 |
| --- | --- | --- |
| `n_estimators` | 树的数量 | 100 起步，越多越稳但越慢 |
| `max_depth` | 每棵树最大深度 | 防止树长得太深 |
| `max_features` | 每次分裂考虑的特征数 | 分类默认常用 `sqrt` |
| `min_samples_leaf` | 叶节点最少样本数 | 增大可减少过拟合 |
| `random_state` | 随机种子 | 固定实验结果 |
| `n_jobs` | 并行训练核心数 | `-1` 使用全部核心 |

在实际项目里，`n_estimators`、`max_depth`、`min_samples_leaf` 经常是第一批需要调的参数。

## 随机森林是否需要标准化

通常不需要。随机森林由决策树组成，树模型主要看特征的阈值切分，不依赖距离或梯度。因此它不像 KNN、SVM、神经网络那样对尺度敏感。

这在表格数据和文本 TF-IDF 特征中很实用。比如你的中文文本分类项目里，流程是：

```text
原始中文文本 -> jieba 分词 -> TF-IDF 向量 -> 随机森林分类
```

随机森林只认识数值特征，TF-IDF 负责把文本变成数值向量。预测时必须使用训练阶段同一个 TF-IDF 向量器，不能重新 `fit` 一个新的，否则特征空间会对不上。

## sklearn 代码示例

下面用鸢尾花数据集训练一个随机森林分类器。

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
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

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print("测试集准确率:", model.score(X_test, y_test))
print(classification_report(y_test, y_pred, target_names=iris.target_names))
print("特征重要性:", model.feature_importances_)
```

和决策树一样，随机森林也有 `feature_importances_`。它能帮助我们观察模型主要依赖哪些特征，但仍然不能直接当成因果解释。

## 用随机森林做文本分类时要注意什么

随机森林可以处理高维特征，因此常被用作传统机器学习文本分类的基线模型。典型流程是：

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

pipe = Pipeline(steps=[
    ("tfidf", TfidfVectorizer(max_features=20000)),
    ("rf", RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)),
])

pipe.fit(train_texts, train_labels)
pred = pipe.predict(test_texts)
```

这里 Pipeline 很重要，因为它能保证训练和预测使用同一套文本向量化流程。你的文本分类项目里保存模型时，也要同时保存：

- 随机森林模型；
- TF-IDF 向量器；
- 标签编号和类别名称的映射。

少保存任何一个，预测阶段都可能对不上。

## 随机森林的优点和局限

优点：

- 比单棵决策树更稳定；
- 对特征缩放不敏感；
- 能处理非线性关系；
- 适合做表格数据和传统文本分类基线；
- 可以输出特征重要性；
- 参数相对容易上手。

局限：

- 模型体积通常比单棵树大；
- 推理速度可能比线性模型慢；
- 可解释性弱于单棵决策树；
- 对极端类别不平衡仍然敏感；
- 不适合无限增大树数量来“硬堆效果”。

## 常见错误

### 以为树越多一定越好

树变多通常会更稳定，但收益会逐渐变小，同时训练和预测成本增加。超过某个数量后，继续增加 `n_estimators` 可能只是浪费时间。

### 忽略类别不平衡

如果某一类样本远多于其他类，随机森林仍可能偏向多数类。可以结合 `class_weight="balanced"`、分层抽样和更合适的评估指标。

### 只保存模型，不保存预处理器

文本分类里尤其危险。训练阶段的 TF-IDF 词表和 IDF 必须保留下来，预测时只能 `transform`，不能重新 `fit_transform`。

## 课后练习

把示例代码中的 `n_estimators` 改成 `10`、`50`、`100`、`300`，观察测试集分数和训练时间变化。再把 `max_depth` 改成 `2`、`5`、`None`，看看模型复杂度对结果的影响。

## 本课总结

- 随机森林由多棵决策树组成；
- 它通过有放回抽样和随机特征选择制造差异；
- 最终分类靠投票，回归靠平均；
- 随机森林通常不需要标准化；
- 它比单棵树更稳，但不是不需要调参和评估。

到这里，我们已经把线性回归、逻辑回归、KNN、决策树、随机森林串起来了。下一步要学习模型评估与交叉验证，避免只凭一次训练结果判断模型好坏。
