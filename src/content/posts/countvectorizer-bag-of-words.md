---
title: 词袋模型与 CountVectorizer：文本也可以做特征表
description: 从词袋模型开始理解文本向量化，学习 CountVectorizer 如何把分词后的中文文本变成可训练的特征矩阵。
cover: /images/covers/countvectorizer-bag-of-words-video.jpg
coverAlt: 多条中文文本经过词袋模型转换成样本乘词表的计数矩阵。
pubDate: 2026-06-30T09:00:00+08:00
tags: [机器学习, NLP, 词袋模型, CountVectorizer, 文本分类]
---

上一课我们讲了 TF-IDF。为了把 TF-IDF 理解得更扎实，这一课先回到更基础的表示方法：**词袋模型**。

词袋模型听起来有点抽象，其实它的想法很朴素：不管词在句子里的顺序，先统计每个词出现了多少次。

<figure class="lesson-video">
  <video controls playsinline preload="metadata" poster="/images/covers/countvectorizer-bag-of-words-video.jpg" aria-label="第 39 课：词袋模型与 CountVectorizer">
    <source src="/videos/lesson-39-countvectorizer-bag-of-words.mp4" type="video/mp4" />
    你的浏览器暂不支持视频播放，可以继续阅读下方文字版课程。
  </video>
  <figcaption>第 39 课视频 · 词袋模型与 CountVectorizer：文本也可以做特征表</figcaption>
</figure>

## 什么是词袋模型

词袋模型的英文是 Bag of Words。它把一段文本看成一个装满词的袋子，只关心袋子里有哪些词、每个词出现了几次。

例如：

```text
我 喜欢 机器学习
机器学习 很 有用
```

如果词表是：

```text
我 / 喜欢 / 机器学习 / 很 / 有用
```

那么第一句话可以表示成：

```text
[1, 1, 1, 0, 0]
```

第二句话可以表示成：

```text
[0, 0, 1, 1, 1]
```

这就把文本变成了数字。

## 词袋模型丢掉了什么

词袋模型有一个明显缺点：它会丢掉顺序。

比如：

```text
我 不 喜欢 这个 功能
我 喜欢 这个 功能 不
```

如果只统计词频，两句话包含的词差不多，但真实语义可能完全不同。

所以词袋模型不是完美的语言理解方法。它更像一个简单、稳定、容易解释的文本特征表。

入门阶段先掌握它很有价值，因为后面的 TF-IDF、文本分类 baseline、模型评估都会建立在这个基础上。

## CountVectorizer 做了什么

在 sklearn 里，`CountVectorizer` 就是用来做词袋特征的工具。

它主要做两件事：

1. 从训练文本里建立词表；
2. 把每条文本转换成词频向量。

示例代码：

```python
from sklearn.feature_extraction.text import CountVectorizer

texts = [
    "我 喜欢 机器学习",
    "机器学习 很 有用",
    "这个 功能 不好用",
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

print(vectorizer.get_feature_names_out())
print(X.toarray())
```

这里的 `texts` 已经用空格隔开词了。中文项目里通常需要先用 `jieba` 分词，再把词用空格拼起来。

## fit_transform 和 transform 的区别

这个区别很重要。

```python
X_train_vec = vectorizer.fit_transform(X_train_text)
X_test_vec = vectorizer.transform(X_test_text)
```

训练集用 `fit_transform`，因为要从训练集里学习词表。

测试集只用 `transform`，因为测试集不能参与词表学习，否则就会发生数据泄漏。

这和前面讲过的标准化、Pipeline 是同一个原则：训练阶段学到的规则，测试阶段只能拿来用，不能重新学。

## 词表大小会影响模型

如果训练文本很多，词表可能非常大。词表越大，矩阵列数越多，模型训练也会更重。

常用参数有：

| 参数 | 作用 |
| --- | --- |
| max_features | 最多保留多少个词 |
| min_df | 过滤出现太少的词 |
| max_df | 过滤出现太多的词 |
| ngram_range | 加入连续词组合 |

例如：

```python
vectorizer = CountVectorizer(
    max_features=5000,
    min_df=2,
    max_df=0.9,
    ngram_range=(1, 2),
)
```

这表示最多保留 5000 个特征，过滤太少见和太常见的词，同时加入单词和连续两个词的组合。

## ngram 是什么

`ngram_range=(1, 2)` 表示同时考虑 unigram 和 bigram。

比如文本：

```text
机器 学习 很 有用
```

unigram 是：

```text
机器 / 学习 / 很 / 有用
```

bigram 是：

```text
机器 学习 / 学习 很 / 很 有用
```

加入 bigram 后，模型有机会捕捉“机器 学习”这种连续搭配，而不是只看到“机器”和“学习”两个分散的词。

## 词袋和 TF-IDF 的关系

词袋模型输出的是词频计数。

TF-IDF 可以看成在词频基础上进一步加权：当前文本里重要、全局又有区分度的词权重更高。

所以你可以把关系理解成：

```text
CountVectorizer：数一数每个词出现几次
TfidfVectorizer：在词频基础上考虑全局区分度
```

两者都能用于文本分类。CountVectorizer 更直观，TF-IDF 往往在很多文本分类任务里效果更好。

## 这一课先记住

词袋模型是文本特征工程的第一块积木。

它会把文本变成“样本数 x 词表大小”的矩阵，每一列代表一个词或词组，每个值代表它在文本里的出现次数。

下一课我们把 TF-IDF 和逻辑回归接起来，训练一个真正可运行的中文文本分类 baseline。
