---
title: 训练中文文本分类 baseline：TF-IDF + 逻辑回归
description: 用 TF-IDF 和 LogisticRegression 跑通一个中文文本分类基线模型，理解从分词、划分数据到训练预测的完整流程。
cover: /images/covers/tfidf-logistic-regression-baseline-video.jpg
coverAlt: 中文文本经过分词、TF-IDF 特征提取和逻辑回归模型，输出分类标签。
pubDate: 2026-06-30T09:20:00+08:00
tags: [机器学习, NLP, TF-IDF, 逻辑回归, 文本分类]
---

前面我们已经讲了中文分词、停用词、词袋模型和 TF-IDF。现在终于可以把它们接起来，训练一个真正能跑的文本分类 baseline。

这里的 baseline 指的是“第一版可运行基线”。它不一定是最终最强模型，但必须简单、清楚、可复现，后面的优化都可以拿它做对照。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/tfidf-logistic-regression-baseline-video.jpg" aria-label="第 39 课：TF-IDF + 逻辑回归 baseline">
    <source src="/videos/lesson-39-tfidf-logistic-regression-baseline.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 39 课视频 · 训练中文文本分类 baseline：TF-IDF + 逻辑回归</figcaption>
</figure>

## 为什么选 TF-IDF + 逻辑回归

这个组合非常适合入门文本分类。

TF-IDF 负责把文本变成数字特征，逻辑回归负责学习这些特征和标签之间的关系。

它有几个优点：

1. 训练速度快；
2. 参数不复杂；
3. 效果通常不差；
4. 比较容易解释；
5. 适合当作后续模型的对照组。

如果一个复杂模型比这个 baseline 还差，就说明要先检查数据、标签、特征和评估方式，而不是继续堆模型。

## 准备数据

假设我们有一个 DataFrame：

```python
import pandas as pd

df = pd.read_csv("text_classification.csv")
print(df.head())
```

至少需要两列：

```text
text   原始中文文本
label  文本类别
```

训练之前先做几个基本检查：

```python
print(df.shape)
print(df["label"].value_counts())
print(df["text"].isna().sum())
```

如果有空文本、重复文本、标签极度不平衡，要先处理，否则模型结果很容易失真。

## 分词函数

中文文本要先分词。

```python
import jieba

stopwords = {"的", "了", "是", "在", "和", "也"}

def cut_text(text):
    words = jieba.lcut(str(text))
    words = [w.strip() for w in words if w.strip()]
    words = [w for w in words if w not in stopwords]
    return " ".join(words)

df["text_cut"] = df["text"].apply(cut_text)
```

这里返回的是空格分隔的字符串，因为 `TfidfVectorizer` 默认按空格和规则切分 token。

## 划分训练集和测试集

接下来划分数据。

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    df["text_cut"],
    df["label"],
    test_size=0.2,
    random_state=42,
    stratify=df["label"],
)
```

`stratify=df["label"]` 的作用是尽量保持训练集和测试集里的类别比例一致。

分类任务里，这一点很重要。如果某个类别样本本来就少，随机划分可能让测试集里这个类别过少，评估就不稳定。

## 建立 Pipeline

推荐把 TF-IDF 和模型放进 Pipeline。

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=5000, min_df=2, ngram_range=(1, 2))),
    ("model", LogisticRegression(max_iter=1000)),
])
```

这样做有两个好处。

第一，流程更清楚，训练和预测都用同一条链路。

第二，后面做交叉验证和调参时，不容易发生数据泄漏。

## 训练和预测

训练很简单：

```python
pipe.fit(X_train, y_train)
```

预测：

```python
y_pred = pipe.predict(X_test)
```

如果你想看每个类别的概率：

```python
y_proba = pipe.predict_proba(X_test)
```

不是所有模型都有 `predict_proba`，但逻辑回归通常可以用。

## 看第一版分数

先用 `classification_report` 看整体表现。

```python
from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred))
```

它会输出每个类别的 precision、recall、f1-score 和 support。

不要只盯着 accuracy。文本分类里，少数类的 recall 和 F1 经常更关键。

## 保存 baseline

训练完成后，可以保存模型。

```python
import joblib

joblib.dump(pipe, "text_classifier_baseline.joblib")
```

以后加载：

```python
model = joblib.load("text_classifier_baseline.joblib")
model.predict(["功能 不好用 经常 闪退"])
```

因为我们保存的是整个 Pipeline，所以 TF-IDF 词表和逻辑回归模型都会一起保存。

## baseline 的价值

baseline 的价值不只是给出一个分数，而是建立一条标准流程。

后面你可以逐步对比：

1. 换停用词表有没有提升；
2. 加 bigram 有没有提升；
3. 调 `C` 参数有没有提升；
4. 换朴素贝叶斯、SVM、随机森林有没有提升；
5. 增加数据后有没有提升。

每次只改一个主要变量，才能知道到底是什么带来了变化。

## 这一课先记住

TF-IDF + 逻辑回归是一条很适合文本分类入门的 baseline。

核心流程是：

```text
清洗文本 -> 中文分词 -> 划分数据 -> TF-IDF -> 逻辑回归 -> 评估
```

下一课我们不急着换模型，而是先学会读懂评估结果：混淆矩阵、分类报告和错分样本。
