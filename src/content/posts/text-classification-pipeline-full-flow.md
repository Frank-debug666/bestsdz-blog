---
title: 用 Pipeline 封装中文文本分类全过程
description: 把分词、TF-IDF、模型训练、预测和评估封装成一条可复用 Pipeline，减少数据泄漏和流程不一致。
cover: /images/covers/text-classification-pipeline-full-flow-video.jpg
coverAlt: 中文文本从分词进入 TF-IDF，再进入分类模型，被 Pipeline 串成一条稳定流程。
pubDate: 2026-07-01T09:00:00+08:00
tags: [机器学习, NLP, Pipeline, 文本分类, scikit-learn]
---

前面几课我们已经把中文文本分类的关键零件拆开看过：中文分词、停用词、词袋、TF-IDF、逻辑回归 baseline、模型评估和混淆矩阵。

这一课要做的是把这些零件重新装回去，封装成一条可以训练、可以预测、可以复用的 Pipeline。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/text-classification-pipeline-full-flow-video.jpg" aria-label="第 42 课：用 Pipeline 封装中文文本分类全过程">
    <source src="/videos/lesson-42-text-classification-pipeline-full-flow.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 42 课视频 · 用 Pipeline 封装中文文本分类全过程</figcaption>
</figure>

## 为什么文本分类更需要 Pipeline

文本分类不是只训练一个模型。它至少包含这些步骤：

```text
原始文本
  -> 清洗
  -> 中文分词
  -> TF-IDF 向量化
  -> 分类模型
  -> 预测结果
```

如果这些步骤分散在很多代码块里，最容易出现三个问题：

1. 训练时用了一套分词规则，预测时换了另一套；
2. TF-IDF 在全量数据上提前 fit，造成数据泄漏；
3. 保存模型时只保存分类器，忘了保存词表和 IDF。

Pipeline 的价值，就是把“特征工程”和“模型”固定在同一条链路里。

## 先准备分词后的文本

中文文本通常要先分词。为了让例子更容易理解，我们先把分词结果保存成一列字符串：

```python
import jieba

def cut_text(text):
    words = jieba.lcut(str(text))
    return " ".join(words)

df["text_cut"] = df["text"].apply(cut_text)
```

这里的关键点是：`TfidfVectorizer` 默认按空格切词。我们把中文句子切成空格分隔的词，就能让它像处理英文一样处理中文。

如果你的项目更复杂，也可以把分词写成自定义 transformer，直接放进 Pipeline。初学阶段先用这一种写法，更容易排查问题。

## 建立 TF-IDF + 逻辑回归 Pipeline

现在把向量化和模型封装起来：

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

pipe = Pipeline(steps=[
    ("tfidf", TfidfVectorizer(
        max_features=30000,
        ngram_range=(1, 2),
        min_df=2,
    )),
    ("model", LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
    )),
])
```

这条 Pipeline 里有两个步骤：

| 步骤 | 作用 |
| --- | --- |
| `tfidf` | 学习词表和 IDF，把文本转成稀疏向量 |
| `model` | 在向量上训练分类模型 |

训练时，Pipeline 会先对训练文本执行 `tfidf.fit_transform()`，再把向量交给模型。

预测时，它会对新文本执行 `tfidf.transform()`，然后调用模型的 `predict()`。

## 划分数据并训练

先划分训练集和测试集：

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

然后训练：

```python
pipe.fit(X_train, y_train)
```

不要先在全量文本上 `fit_transform`，再切分训练集和测试集。TF-IDF 的词表和 IDF 也属于从数据里学出来的信息，提前使用测试集会让评估结果虚高。

## 评估模型

训练完成后，直接预测测试集：

```python
from sklearn.metrics import classification_report, confusion_matrix

y_pred = pipe.predict(X_test)

print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```

你会发现：预测时不需要自己再调用 `vectorizer.transform()`。Pipeline 已经把这件事封装好了。

这能减少很多“训练能跑，预测报错”的问题。

## 用 Pipeline 做交叉验证

Pipeline 也适合和交叉验证一起用：

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(
    pipe,
    df["text_cut"],
    df["label"],
    cv=5,
    scoring="f1_macro",
)

print(scores.mean(), scores.std())
```

每一折交叉验证都会重新 fit 一个新的 TF-IDF 和模型。验证折不会提前参与当前折的词表学习，这样评估更可信。

## 用 GridSearchCV 调参数

Pipeline 里的参数可以一起搜索，写法是：

```text
步骤名__参数名
```

例如：

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    "tfidf__max_features": [10000, 30000, 50000],
    "tfidf__ngram_range": [(1, 1), (1, 2)],
    "model__C": [0.3, 1.0, 3.0],
}

search = GridSearchCV(
    pipe,
    param_grid=param_grid,
    cv=5,
    scoring="f1_macro",
    n_jobs=-1,
)

search.fit(X_train, y_train)

print(search.best_params_)
print(search.best_score_)
```

这里不是单独调模型，而是连“怎么提取文本特征”也一起调。

## 封装预测函数

实际使用时，可以再包一层预测函数：

```python
def predict_texts(texts):
    cut_texts = [cut_text(text) for text in texts]
    return pipe.predict(cut_texts)

result = predict_texts([
    "这个课程讲得很清楚，适合初学者",
    "页面一直打不开，体验很差",
])

print(result)
```

注意：新文本也必须经过同样的分词函数。否则训练文本和预测文本的形态不一致，模型效果会不稳定。

## 这一课先记住

Pipeline 不是为了让代码看起来高级，而是为了让流程稳定。

中文文本分类项目里，推荐把这些内容固定下来：

```text
分词规则
  -> TF-IDF 参数
  -> 分类模型
  -> 评估方式
  -> 预测函数
```

当这条链路稳定后，下一步就可以把它保存下来，让训练好的模型在下次运行时直接复用。
